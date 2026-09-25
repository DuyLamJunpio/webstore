/**
 * SePay webhook helpers. SePay observes an ordinary VietQR transfer, so QR
 * creation stays local while this module authenticates the notification.
 */

import { timingSafeEqual } from "node:crypto";
import { getOrder, ORDER_REF_LENGTH, type Order } from "./orders";

const PREFIX_PATTERN = /^[A-Za-z]{2,5}$/;
/** API Token ("API Access") endpoints. /api/v1 only accepts OAuth tokens and answers 401. */
const SEPAY_API_URL = "https://my.sepay.vn/userapi/bankaccounts";
const CACHE_MS = 5 * 60 * 1000;
/** each candidate ref costs an order lookup before SePay's 30-second deadline */
const MAX_REF_CANDIDATES = 3;

export type SepayWebhook = {
  id: number;
  code?: string | null;
  content?: string | null;
  /** the bank's full notification text */
  description?: string | null;
  transferType?: string | null;
  transferAmount?: number | string | null;
  referenceCode?: string | null;
};

export type SepayWebhookConfig = {
  apiKey: string;
  paymentPrefix: string;
};

export type SepayBank = {
  bin: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
};

type SepayBankAccountResponse = {
  /** from details/{id} */
  bankaccount?: unknown;
  /** from list */
  bankaccounts?: unknown;
};

type SepayBankAccount = {
  id?: string;
  /** "1" active, "0" suspended */
  active?: string;
  account_holder_name?: string;
  account_number?: string;
  bank_short_name?: string;
  bank_full_name?: string;
  bank_bin?: string;
};

type Cache = { bank: SepayBank; expiresAt: number };
let bankCache: Cache | null = null;

/** Settings required to authenticate SePay's incoming webhook. */
export function readSepayWebhookConfig(): SepayWebhookConfig | null {
  const apiKey = process.env.SEPAY_WEBHOOK_API_KEY?.trim();
  const paymentPrefix = (process.env.SEPAY_PAYMENT_PREFIX ?? "TBC").trim().toUpperCase();

  if (!apiKey || !PREFIX_PATTERN.test(paymentPrefix)) return null;
  return { apiKey, paymentPrefix };
}

export const isSepayConfigured = () => readSepayWebhookConfig() !== null;

function parseBankAccount(value: unknown): SepayBank | null {
  if (!value || typeof value !== "object") return null;
  const account = value as SepayBankAccount;
  const bin = account.bank_bin?.trim();
  const accountNumber = account.account_number?.trim();
  const accountName = account.account_holder_name?.trim();
  if (!bin || !accountNumber || !accountName || !/^\d{6}$/.test(bin)) return null;

  return {
    bin,
    accountNumber,
    accountName,
    bankName: account.bank_short_name?.trim() || account.bank_full_name?.trim() || "",
  };
}

/**
 * Reads the recipient account from SePay. An ID is mandatory when more than
 * one active account is linked, so a new account cannot silently receive QR
 * payments intended for the shop's current account.
 */
export async function getSepayBankAccount(): Promise<SepayBank> {
  const token = process.env.SEPAY_API_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("Thiếu SEPAY_API_ACCESS_TOKEN.");

  if (bankCache && bankCache.expiresAt > Date.now()) return bankCache.bank;

  const configuredId = process.env.SEPAY_BANK_ACCOUNT_ID?.trim();
  if (configuredId && !/^\d+$/.test(configuredId)) {
    throw new Error("SEPAY_BANK_ACCOUNT_ID phải là ID số của tài khoản SePay.");
  }

  const endpoint = configuredId ? `${SEPAY_API_URL}/details/${configuredId}` : `${SEPAY_API_URL}/list`;
  let response: Response;
  try {
    response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[sepay] không thể kết nối API tài khoản", error);
    throw new Error("Không kết nối được SePay để lấy tài khoản nhận tiền.");
  }

  if (!response.ok) {
    console.error("[sepay] API tài khoản trả về", response.status);
    throw new Error(
      response.status === 401 || response.status === 403
        ? "API Access SePay không hợp lệ hoặc chưa có quyền xem tài khoản."
        : "SePay không trả được thông tin tài khoản nhận tiền.",
    );
  }

  const payload = (await response.json().catch(() => null)) as SepayBankAccountResponse | null;
  const records = configuredId
    ? [payload?.bankaccount]
    : Array.isArray(payload?.bankaccounts)
      ? payload.bankaccounts.filter((item): item is SepayBankAccount => Boolean(item && typeof item === "object" && (item as SepayBankAccount).active === "1"))
      : [];

  if (!configuredId && records.length > 1) {
    throw new Error("SePay có nhiều tài khoản đang hoạt động. Vui lòng đặt SEPAY_BANK_ACCOUNT_ID.");
  }

  const bank = parseBankAccount(records[0]);
  if (!bank) throw new Error("Không tìm thấy tài khoản SePay hợp lệ để tạo QR.");

  bankCache = { bank, expiresAt: Date.now() + CACHE_MS };
  return bank;
}

/** SePay recognises this full text as the configured prefix plus the order ref. */
export function sepayPaymentCode(ref: string, config = readSepayWebhookConfig()): string {
  if (!config) throw new Error("Chưa cấu hình SePay.");
  return `${config.paymentPrefix}${ref}`;
}

/**
 * Order refs a transfer may be paying for, most likely first.
 *
 * SePay fills `code` only when a pattern under Cấu hình Công ty → Cấu hình
 * chung → Cấu trúc mã thanh toán matches the memo. Without one, `code` arrives
 * null although the memo still reads "…TBCSBGRY6WMQM…", so the memo is read too.
 * A candidate is only a guess: the caller must find a stored order expecting
 * exactly that payment code.
 */
export function sepayPaymentRefs(body: SepayWebhook, config: SepayWebhookConfig): string[] {
  const texts = [body.code, body.content, body.description]
    .filter((text): text is string => typeof text === "string")
    .map((text) => text.toUpperCase());
  const code = `${config.paymentPrefix}([A-Z0-9]{${ORDER_REF_LENGTH}})`;
  // The code standing as its own word — as the QR prefills it — goes first, so
  // look-alikes buried in a bank's trace numbers cannot crowd it past the cap.
  const word = new RegExp(`(?<![A-Z0-9])${code}(?![A-Z0-9])`, "g");
  // Then any run once separators are dropped, for codes typed with spaces or
  // dots. A lookahead, so "TBCTBC<ref>" still yields <ref> after the false start.
  const run = new RegExp(`(?=${code})`, "g");

  const words = texts.flatMap((text) => Array.from(text.matchAll(word), (match) => match[1]));
  const runs = texts.flatMap((text) =>
    Array.from(text.replace(/[^A-Z0-9]/g, "").matchAll(run), (match) => match[1]),
  );
  // A run that swallowed the next prefix ("TBC" + "TBCSBGRY6W") is almost always
  // a doubled prefix, not a ref, so it waits behind every other candidate.
  const doubled = (ref: string) => ref.startsWith(config.paymentPrefix);
  const ranked = [...words, ...runs.filter((ref) => !doubled(ref)), ...runs.filter(doubled)];

  return Array.from(new Set(ranked)).slice(0, MAX_REF_CANDIDATES);
}

/**
 * The first candidate that is a stored SePay order expecting exactly this
 * payment code. A failed lookup throws on purpose: the webhook then answers 500
 * and SePay delivers the same transfer again.
 */
export async function findSepayOrder(
  refs: string[],
  config: SepayWebhookConfig,
  lookup: (ref: string) => Promise<Order | null> = getOrder,
): Promise<Order | null> {
  for (const ref of refs) {
    const order = await lookup(ref);
    if (order?.payment.provider === "sepay" && order.payment.description === sepayPaymentCode(ref, config)) {
      return order;
    }
  }
  return null;
}

/** API-key auth from SePay's `Authorization: Apikey <key>` header. */
export function hasValidSepayAuthorization(request: Request, config = readSepayWebhookConfig()): boolean {
  if (!config) return false;

  const supplied = request.headers.get("authorization") ?? "";
  const expected = `Apikey ${config.apiKey}`;
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);

  return suppliedBytes.length === expectedBytes.length && timingSafeEqual(suppliedBytes, expectedBytes);
}

export function asVnd(value: unknown): number | null {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}
