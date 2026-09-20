/**
 * SePay webhook helpers. SePay observes an ordinary VietQR transfer, so QR
 * creation stays local while this module authenticates the notification.
 */

import { timingSafeEqual } from "node:crypto";
const PREFIX_PATTERN = /^[A-Za-z]{2,5}$/;
const SEPAY_API_URL = "https://my.sepay.vn/api/v1/bank-accounts";
const CACHE_MS = 5 * 60 * 1000;

export type SepayWebhook = {
  id: number;
  code?: string | null;
  content?: string | null;
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
  status?: string;
  data?: unknown;
};

type SepayBankAccount = {
  id?: number;
  active?: boolean;
  account_holder_name?: string;
  account_number?: string;
  bank?: { short_name?: string; full_name?: string; bin?: string };
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
  const bin = account.bank?.bin?.trim();
  const accountNumber = account.account_number?.trim();
  const accountName = account.account_holder_name?.trim();
  if (!bin || !accountNumber || !accountName || !/^\d{6}$/.test(bin)) return null;

  return {
    bin,
    accountNumber,
    accountName,
    bankName: account.bank?.short_name?.trim() || account.bank?.full_name?.trim() || "",
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

  const endpoint = configuredId ? `${SEPAY_API_URL}/${configuredId}` : `${SEPAY_API_URL}?page=1&limit=100`;
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
    ? [payload?.data]
    : Array.isArray(payload?.data)
      ? payload.data.filter((item): item is SepayBankAccount => Boolean(item && typeof item === "object" && (item as SepayBankAccount).active))
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
