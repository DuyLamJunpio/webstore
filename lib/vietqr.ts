/**
 * A VietQR payload built locally, used only when PayOS is not configured yet.
 *
 * PayOS returns a ready-made QR string with every order; this is the stand-in
 * so the checkout page is still testable before the merchant keys exist. It
 * produces a real, scannable transfer QR — but nothing is reconciling it, so an
 * order paid this way stays "chờ thanh toán" until a human checks the bank.
 *
 * Format: EMVCo Merchant-Presented QR, VietQR profile (NAPAS GUID A000000727).
 */

const GUID = "A000000727";
const SERVICE_TO_ACCOUNT = "QRIBFTTA";
const CURRENCY_VND = "704";
const COUNTRY_VN = "VN";

/** EMVCo field: two-digit id, two-digit length, value */
const tlv = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;

/** CRC-16/CCITT-FALSE over the payload, including the trailing "6304" tag */
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** the memo field is ASCII-only on most banking apps, so fold the diacritics out */
export const asciiMemo = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^\w\s.-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export type VietQrInput = {
  /** 6-digit NAPAS bank code, e.g. 970422 for MB Bank */
  bin: string;
  accountNumber: string;
  /** integer VND — omitted for an open-amount QR */
  amount?: number;
  /** transfer memo */
  addInfo?: string;
};

export function buildVietQr({ bin, accountNumber, amount, addInfo }: VietQrInput): string {
  const beneficiary = tlv("00", bin) + tlv("01", accountNumber);
  const merchantAccount = tlv("00", GUID) + tlv("01", beneficiary) + tlv("02", SERVICE_TO_ACCOUNT);

  const payload =
    tlv("00", "01") +
    // 12 = single-use: the amount is baked in, so the QR should not be reused
    tlv("01", amount ? "12" : "11") +
    tlv("38", merchantAccount) +
    tlv("53", CURRENCY_VND) +
    (amount ? tlv("54", String(Math.round(amount))) : "") +
    tlv("58", COUNTRY_VN) +
    (addInfo ? tlv("62", tlv("08", asciiMemo(addInfo).slice(0, 99))) : "");

  const withCrcTag = `${payload}6304`;
  return withCrcTag + crc16(withCrcTag);
}

/** the shop's own bank details, used only by the fallback above */
export function readFallbackBank() {
  const bin = process.env.SHOP_BANK_BIN;
  const accountNumber = process.env.SHOP_BANK_ACCOUNT;
  const accountName = process.env.SHOP_BANK_ACCOUNT_NAME;
  if (!bin || !accountNumber || !accountName) return null;
  return { bin, accountNumber, accountName, bankName: process.env.SHOP_BANK_NAME ?? "" };
}
