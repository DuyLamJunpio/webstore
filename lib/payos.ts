/**
 * PayOS merchant API — bank transfer / VietQR.
 *
 * Server only: the checksum key signs every request and must never reach a
 * browser bundle. Nothing here imports React, and no export is safe to call
 * from a client component.
 *
 * Two different signatures are involved and they are NOT interchangeable:
 *
 *   • creating a link  — five fields in a fixed order, spelled out in `create`
 *   • everything else  — every field of the `data` object, keys sorted A→Z
 *
 * PayOS signs its own responses and its webhooks with the second one. Every
 * response that could move an order to "paid" is checked against it, so a
 * tampered reply cannot fulfil an order that nobody paid for.
 *
 * Deliberately a thin hand-rolled client rather than `@payos/node`: the surface
 * used here is three endpoints and two HMACs. It is kept byte-for-byte
 * compatible with that SDK's crypto (v2.0.5) — see `toSignedString`.
 *
 * Docs: https://payos.vn/docs/api/
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/** same env name the official SDK reads, for anyone who later swaps this out */
const BASE_URL = process.env.PAYOS_BASE_URL ?? "https://api-merchant.payos.vn";
const REQUEST_TIMEOUT_MS = 15_000;

type PayosConfig = {
  clientId: string;
  apiKey: string;
  checksumKey: string;
  partnerCode?: string;
};

function readConfig(): PayosConfig | null {
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
  if (!clientId || !apiKey || !checksumKey) return null;
  return { clientId, apiKey, checksumKey, partnerCode: process.env.PAYOS_PARTNER_CODE };
}

/** false when the shop has no PayOS keys yet — checkout falls back to a preview QR */
export const isPayosConfigured = () => readConfig() !== null;

export class PayosError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "PayosError";
  }
}

// ── signatures ───────────────────────────────────────────────────────

const hmac = (data: string, key: string) => createHmac("sha256", key).update(data).digest("hex");

/**
 * Turns a response/webhook `data` object into the string PayOS signed.
 *
 * This mirrors `@payos/node`'s `sortObjDataByKey` + `convertObjToQueryStr`
 * exactly, quirks included, because "close enough" here means every webhook is
 * rejected:
 *
 *   • keys sorted with a bare `.sort()` — UTF-16 code units, not locale rules
 *   • `undefined` values drop their key entirely; `null` and the *strings*
 *     "null"/"undefined" become an empty value
 *   • arrays are JSON, each element's own keys sorted one level deep
 */
function toSignedString(data: Record<string, unknown>): string {
  const sortKeys = (value: unknown) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : value;

  return Object.keys(data)
    .sort()
    .filter((key) => data[key] !== undefined)
    .map((key) => {
      const raw = data[key];
      const value = Array.isArray(raw) ? JSON.stringify(raw.map(sortKeys)) : raw;
      return value === null || value === "null" || value === "undefined"
        ? `${key}=`
        : `${key}=${value}`;
    })
    .join("&");
}

/** constant-time compare so a wrong signature leaks nothing through timing */
function signatureMatches(expected: string, received: unknown): boolean {
  if (typeof received !== "string" || received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(received, "utf8"));
}

// ── requests ─────────────────────────────────────────────────────────

type PayosEnvelope<T> = { code?: string; desc?: string; data?: T; signature?: string };

/**
 * `verify` is on for every call whose answer we act on. PayOS signs the `data`
 * of its responses the same way it signs webhooks, and the official SDK checks
 * create, get and cancel alike — skipping it on `get` would let a tampered
 * reply flip an order to PAID.
 */
async function request<T>(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown; verify?: boolean },
  config: PayosConfig,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        "x-client-id": config.clientId,
        "x-api-key": config.apiKey,
        ...(config.partnerCode ? { "x-partner-code": config.partnerCode } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      // payment endpoints are never cached, on either side of the wire
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    throw new PayosError(
      cause instanceof Error && cause.name === "TimeoutError"
        ? "PayOS không phản hồi kịp thời."
        : "Không kết nối được tới PayOS.",
      "network",
    );
  }

  const envelope = (await response.json().catch(() => null)) as PayosEnvelope<T> | null;

  // "00" is PayOS's success code; it can return a business error on a 200, and
  // a readable `desc` on a 401/429 — prefer that message over the status line
  if (!envelope) {
    throw new PayosError(`PayOS trả về lỗi HTTP ${response.status}.`, `http_${response.status}`);
  }
  if (envelope.code !== "00" || !envelope.data) {
    throw new PayosError(
      envelope.desc || `PayOS từ chối yêu cầu (HTTP ${response.status}).`,
      envelope.code ?? `http_${response.status}`,
    );
  }

  if (init.verify && envelope.signature) {
    const expected = hmac(
      toSignedString(envelope.data as unknown as Record<string, unknown>),
      config.checksumKey,
    );
    if (!signatureMatches(expected, envelope.signature)) {
      throw new PayosError("Chữ ký phản hồi từ PayOS không hợp lệ.", "bad_signature");
    }
  }

  return envelope.data;
}

// ── statuses ─────────────────────────────────────────────────────────

/** the full set `@payos/node` declares — UNDERPAID and FAILED are easy to miss */
export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "UNDERPAID"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED";

const STATUSES: PaymentStatus[] = [
  "PENDING",
  "PROCESSING",
  "PAID",
  "UNDERPAID",
  "CANCELLED",
  "EXPIRED",
  "FAILED",
];

/** anything PayOS invents later is treated as "still waiting" rather than crashing */
export const asPaymentStatus = (value: unknown): PaymentStatus =>
  STATUSES.includes(value as PaymentStatus) ? (value as PaymentStatus) : "PENDING";

// ── create a payment link ────────────────────────────────────────────

export type PayosItem = { name: string; quantity: number; price: number };

export type CreatePaymentLinkInput = {
  orderCode: number;
  /** integer VND */
  amount: number;
  /** the transfer memo — see DESCRIPTION_MAX before making this longer */
  description: string;
  returnUrl: string;
  cancelUrl: string;
  items: PayosItem[];
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  /** unix seconds; after this the QR stops working */
  expiredAt?: number;
};

export type PaymentLink = {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  currency?: string;
  paymentLinkId: string;
  status: PaymentStatus;
  expiredAt?: number;
  checkoutUrl: string;
  /** raw VietQR (EMVCo) payload — render it, do not show it */
  qrCode: string;
};

/**
 * Nine. Not twenty-five.
 *
 * The API reference is explicit: "Mô tả thanh toán, với tài khoản ngân hàng
 * không phải liên kết qua payOS thì giới hạn ký tự là 9". Shops on a plain bank
 * account — the common case — get nine characters, because PayOS needs the rest
 * of the memo for its own matching code. Nothing is lost by staying inside it:
 * reconciliation keys off `orderCode`, which travels in the webhook.
 */
export const DESCRIPTION_MAX = 9;

export async function createPaymentLink(input: CreatePaymentLinkInput): Promise<PaymentLink> {
  const config = readConfig();
  if (!config) throw new PayosError("Chưa cấu hình PayOS.", "not_configured");

  const description = input.description.slice(0, DESCRIPTION_MAX);
  // this exact field order is the contract — sorting it or adding fields breaks the checksum
  const signature = hmac(
    `amount=${input.amount}&cancelUrl=${input.cancelUrl}&description=${description}` +
      `&orderCode=${input.orderCode}&returnUrl=${input.returnUrl}`,
    config.checksumKey,
  );

  const data = await request<PaymentLink>(
    "/v2/payment-requests",
    { method: "POST", body: { ...input, description, signature }, verify: true },
    config,
  );

  return { ...data, status: asPaymentStatus(data.status) };
}

// ── read / cancel ────────────────────────────────────────────────────

export type PaymentTransaction = {
  reference: string;
  amount: number;
  accountNumber: string;
  description: string;
  transactionDateTime: string;
  virtualAccountName?: string | null;
  virtualAccountNumber?: string | null;
  counterAccountBankId?: string | null;
  counterAccountBankName?: string | null;
  counterAccountName?: string | null;
  counterAccountNumber?: string | null;
};

export type PaymentLinkInfo = {
  id: string;
  orderCode: number;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  status: PaymentStatus;
  createdAt: string;
  canceledAt?: string | null;
  cancellationReason?: string | null;
  transactions: PaymentTransaction[];
};

/** `id` may be the numeric orderCode or PayOS's own paymentLinkId */
export async function getPaymentLink(id: number | string): Promise<PaymentLinkInfo> {
  const config = readConfig();
  if (!config) throw new PayosError("Chưa cấu hình PayOS.", "not_configured");

  const data = await request<PaymentLinkInfo>(
    `/v2/payment-requests/${id}`,
    { method: "GET", verify: true },
    config,
  );
  return { ...data, status: asPaymentStatus(data.status) };
}

export async function cancelPaymentLink(
  id: number | string,
  reason?: string,
): Promise<PaymentLinkInfo> {
  const config = readConfig();
  if (!config) throw new PayosError("Chưa cấu hình PayOS.", "not_configured");

  const data = await request<PaymentLinkInfo>(
    `/v2/payment-requests/${id}/cancel`,
    { method: "POST", body: reason ? { cancellationReason: reason } : undefined, verify: true },
    config,
  );
  return { ...data, status: asPaymentStatus(data.status) };
}

// ── webhook ──────────────────────────────────────────────────────────

export type WebhookData = {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  currency?: string;
  counterAccountBankId?: string | null;
  counterAccountBankName?: string | null;
  counterAccountName?: string | null;
  counterAccountNumber?: string | null;
  virtualAccountName?: string | null;
  virtualAccountNumber?: string | null;
};

export type WebhookBody = {
  code?: string;
  desc?: string;
  success?: boolean;
  data?: WebhookData;
  signature?: string;
};

/**
 * Returns the payload only if it really came from PayOS. Everything downstream
 * of this — marking an order paid, emailing the shopper — must sit behind it,
 * because the webhook URL itself is public.
 */
export function verifyWebhook(body: WebhookBody): WebhookData | null {
  const config = readConfig();
  if (!config || !body?.data || !body.signature) return null;

  const expected = hmac(
    toSignedString(body.data as unknown as Record<string, unknown>),
    config.checksumKey,
  );
  return signatureMatches(expected, body.signature) ? body.data : null;
}

/** registers this deployment's webhook URL with PayOS — PayOS calls it once to check */
export async function confirmWebhook(webhookUrl: string): Promise<void> {
  const config = readConfig();
  if (!config) throw new PayosError("Chưa cấu hình PayOS.", "not_configured");

  await request<unknown>("/confirm-webhook", { method: "POST", body: { webhookUrl } }, config);
}
