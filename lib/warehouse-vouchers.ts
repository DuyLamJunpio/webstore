import type { Voucher, VoucherQuote } from "./vouchers";
import { warehouseFetch } from "./warehouse";

type VoucherFailure = { ok: false; error: string };
type VoucherSuccess = { ok: true; quote: VoucherQuote };
export type WarehouseVoucherResult = VoucherSuccess | VoucherFailure;

function isVoucher(value: unknown): value is Voucher {
  if (!value || typeof value !== "object") return false;
  const voucher = value as Partial<Voucher>;
  return typeof voucher.code === "string" && typeof voucher.name === "string"
    && typeof voucher.description === "string"
    && (voucher.type === "percentage" || voucher.type === "fixed_amount" || voucher.type === "free_shipping")
    && typeof voucher.value === "number" && typeof voucher.minOrder === "number";
}

/** Ask Warehouse to apply its current voucher rules to a server-priced cart. */
export async function validateWarehouseVoucher(rawCode: string | undefined, subtotal: number, shipping: number): Promise<WarehouseVoucherResult> {
  const code = rawCode?.trim().toUpperCase();
  if (!code) return { ok: false, error: "Vui lòng nhập mã giảm giá." };

  try {
    const response = await warehouseFetch("/api/storefront/vouchers/validate", {
      method: "POST",
      body: JSON.stringify({ code, subtotal, shipping }),
    });
    const data = (await response.json().catch(() => null)) as
      | { voucher?: unknown; discount?: unknown; new_shipping?: unknown; message?: unknown; error?: unknown }
      | null;

    if (!response.ok || !data || !isVoucher(data.voucher) || typeof data.discount !== "number"
      || typeof data.new_shipping !== "number" || typeof data.message !== "string") {
      return { ok: false, error: typeof data?.error === "string" ? data.error : "Không thể kiểm tra mã giảm giá lúc này." };
    }

    return { ok: true, quote: { voucher: data.voucher, discount: Math.max(0, Math.round(data.discount)), newShipping: Math.max(0, Math.round(data.new_shipping)), message: data.message } };
  } catch (error) {
    console.error("[voucher] Warehouse không phản hồi", error);
    return { ok: false, error: "Không kết nối được hệ thống voucher. Vui lòng thử lại." };
  }
}

/** Only active Warehouse vouchers are suitable for customer-facing suggestions. */
export async function getWarehouseVouchers(): Promise<Voucher[]> {
  try {
    const response = await warehouseFetch("/api/storefront/vouchers");
    const data = (await response.json().catch(() => null)) as { vouchers?: unknown } | null;
    return response.ok && Array.isArray(data?.vouchers) ? data.vouchers.filter(isVoucher) : [];
  } catch (error) {
    console.error("[voucher] không tải được danh sách Warehouse", error);
    return [];
  }
}
