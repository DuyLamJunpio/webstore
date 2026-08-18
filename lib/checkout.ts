/**
 * Checkout — the rules both sides of the wire agree on.
 *
 * The browser uses this to validate the form before it posts and to show the
 * shopper what they are about to pay; the server uses the very same functions
 * to price the order again from the catalogue. Nothing the client sends about
 * money is trusted: it may only name a variant and a quantity, and `priceCart`
 * decides what that actually costs.
 *
 * Everything here is đồng, whole numbers, start to finish — the catalogue, the
 * cart, and the amount handed to PayOS are the same figure. There is no
 * conversion step left to disagree with itself.
 */

import { IS_TEST_PRICING, type Catalogue } from "./data";

/**
 * Giao hàng miễn phí từ mức này — con số kinh doanh, chỉnh thoải mái.
 *
 * Ở chế độ giá thử thì hạ về 0, tức luôn miễn phí ship. Không có dòng này thì
 * đơn 1.000 ₫ vẫn bị cộng 30.000 ₫ tiền ship và tổng ra 31.000 ₫ — đúng cái
 * khoản mà giá thử sinh ra để tránh.
 */
export const FREE_SHIPPING_THRESHOLD = IS_TEST_PRICING ? 0 : 500_000;
export const SHIPPING_FLAT = 30_000;

/** how long a bank-transfer QR stays valid before PayOS closes the link */
export const PAYMENT_WINDOW_MINUTES = 15;

// ── what the browser posts ───────────────────────────────────────────

/** one cart line, stripped to the only two things the client may decide */
export type CheckoutLine = { id: string; qty: number };

export type CustomerInfo = {
  fullName: string;
  phone: string;
  email: string;
  /** số nhà, tên đường */
  address: string;
  /** phường / xã */
  ward: string;
  /** tỉnh / thành phố */
  city: string;
  note: string;
};

export type CustomerField = keyof CustomerInfo;

export const EMPTY_CUSTOMER: CustomerInfo = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  ward: "",
  city: "",
  note: "",
};

// ── validation ───────────────────────────────────────────────────────

/** 0xx or +84xx, spaces and dots allowed while typing */
const PHONE = /^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const normalizePhone = (value: string) => value.replace(/[\s.()-]/g, "");

export type CustomerErrors = Partial<Record<CustomerField, string>>;

export function validateCustomer(input: CustomerInfo): CustomerErrors {
  const errors: CustomerErrors = {};
  const trimmed = <K extends CustomerField>(key: K) => input[key].trim();

  if (trimmed("fullName").length < 2) errors.fullName = "Vui lòng nhập họ và tên người nhận.";
  if (!PHONE.test(normalizePhone(trimmed("phone"))))
    errors.phone = "Số điện thoại chưa đúng — ví dụ 0901 234 567.";
  // Bắt buộc: thư xác nhận sau khi nhận được tiền là thứ duy nhất khách cầm
  // được về đơn hàng — shop không có tài khoản đăng nhập để tra cứu lại.
  if (!trimmed("email")) errors.email = "Vui lòng nhập email để nhận xác nhận đơn hàng.";
  else if (!EMAIL.test(trimmed("email"))) errors.email = "Địa chỉ email chưa đúng.";
  if (trimmed("address").length < 4) errors.address = "Vui lòng nhập số nhà và tên đường.";
  if (!trimmed("ward")) errors.ward = "Vui lòng nhập phường / xã.";
  if (!trimmed("city")) errors.city = "Vui lòng nhập tỉnh / thành phố.";
  if (trimmed("note").length > 300) errors.note = "Ghi chú tối đa 300 ký tự.";

  return errors;
}

export function cleanCustomer(input: CustomerInfo): CustomerInfo {
  return {
    fullName: input.fullName.trim().slice(0, 100),
    phone: normalizePhone(input.phone.trim()).slice(0, 20),
    email: input.email.trim().slice(0, 120),
    address: input.address.trim().slice(0, 200),
    ward: input.ward.trim().slice(0, 100),
    city: input.city.trim().slice(0, 100),
    note: input.note.trim().slice(0, 300),
  };
}

export const formatAddress = (customer: CustomerInfo) =>
  [customer.address, customer.ward, customer.city].filter(Boolean).join(", ");

// ── pricing ──────────────────────────────────────────────────────────

export type PricedLine = {
  id: string;
  slug: string;
  name: string;
  image: string;
  color: string;
  size: string;
  /** đồng, straight from the catalogue — never from the request body */
  unitPrice: number;
  qty: number;
  total: number;
};

export type PricedCart = {
  lines: PricedLine[];
  count: number;
  subtotal: number;
  shipping: number;
  /** đồng, whole — this is exactly the figure handed to PayOS */
  total: number;
};

/** guest carts are not a bulk-order channel */
const MAX_LINES = 40;

export type PriceResult = { ok: true; cart: PricedCart } | { ok: false; error: string };

/**
 * Re-prices a cart from the catalogue. Anything the client cannot be trusted
 * with — price, stock ceiling, product name — is looked up here, so a tampered
 * localStorage cart buys nothing it should not.
 */
export function priceCart(catalogue: Catalogue, input: CheckoutLine[]): PriceResult {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, error: "Giỏ hàng đang trống." };
  if (input.length > MAX_LINES) return { ok: false, error: "Giỏ hàng có quá nhiều sản phẩm." };

  const lines: PricedLine[] = [];

  for (const raw of input) {
    if (!raw || typeof raw.id !== "string" || !Number.isFinite(raw.qty)) {
      return { ok: false, error: "Giỏ hàng không hợp lệ. Vui lòng tải lại trang." };
    }

    const product = catalogue.products.find((candidate) =>
      candidate.variants.some((v) => v.id === raw.id),
    );
    const variant = product?.variants.find((v) => v.id === raw.id);
    if (!product || !variant) {
      return { ok: false, error: "Một sản phẩm trong giỏ không còn tồn tại. Vui lòng kiểm tra lại giỏ hàng." };
    }

    if (variant.stock === 0) {
      return { ok: false, error: `${product.name} (${variant.color} · ${variant.size}) đã hết hàng.` };
    }

    // duplicated lines are merged rather than rejected — same variant, one row
    const qty = Math.min(Math.max(Math.floor(raw.qty), 1), variant.stock);
    const existing = lines.find((line) => line.id === variant.id);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, variant.stock);
      existing.total = existing.unitPrice * existing.qty;
      continue;
    }

    lines.push({
      id: variant.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      color: variant.color,
      size: variant.size,
      unitPrice: product.price,
      qty,
      total: product.price * qty,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  // PayOS only accepts whole đồng; a catalogue price with a decimal in it would
  // otherwise reach the bank rounded and no longer match what the page showed
  const total = Math.round(subtotal + shipping);

  return {
    ok: true,
    cart: {
      lines,
      count: lines.reduce((sum, line) => sum + line.qty, 0),
      subtotal,
      shipping,
      total,
    },
  };
}
