/**
 * Đẩy đơn hàng sang trang quản trị (Laravel).
 *
 * Trang quản trị chỉ nhận đơn chuyển khoản sau khi PayOS đã xác nhận PAID. Trước
 * đó, trang bán hàng chỉ lưu phiên thanh toán nội bộ để không đẩy đơn rác hoặc mẫu
 * chưa trả tiền vào màn hình nhân viên. COD hàng bán sẵn vẫn tạo đơn khi khách đặt.
 */

import type { CustomerInfo, PricedCart } from "./checkout";
import type { PaymentMethodKey } from "./sales";

const BASE = (process.env.WAREHOUSE_API_URL ?? "").replace(/\/$/, "");

export const isWarehouseConfigured = () => BASE.length > 0;

export type WarehouseResult =
  | { ok: true; orderCode: string; total: number }
  | { ok: false; error: string; outOfStock: boolean };

export type WarehouseFulfillmentResult =
  | { ok: true; orderCode: string }
  | { ok: false; error: string };

const TIMEOUT_MS = 15_000;

/**
 * Bí mật dùng chung với trang quản trị, cho những endpoint không được để ngỏ:
 *
 *   • báo đã thanh toán — nó đổi trạng thái tiền bạc, mà chính khách đặt hàng
 *     cũng biết mã đơn của mình, nên không xác thực là họ tự đánh dấu "đã trả
 *     tiền" được;
 *   • chỗ lưu đơn của trang thanh toán — payload có tên, số điện thoại và địa
 *     chỉ của khách.
 */
const WEBHOOK_SECRET = process.env.WAREHOUSE_WEBHOOK_SECRET ?? "";

/**
 * Gọi một endpoint server-to-server của trang quản trị.
 *
 * Cố ý ném lỗi khi chưa cấu hình thay vì trả về một giá trị rỗng: những endpoint
 * đi qua đây giữ đơn hàng, mà một đơn "không tìm thấy" vì thiếu biến môi trường
 * thì trông y như một đơn không tồn tại — hỏng cùng một cách nhưng mất hàng giờ
 * mới đoán ra.
 */
export async function warehouseFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!isWarehouseConfigured()) {
    throw new Error("Chưa cấu hình WAREHOUSE_API_URL nên không gọi được trang quản trị.");
  }
  if (!WEBHOOK_SECRET) {
    throw new Error("Chưa cấu hình WAREHOUSE_WEBHOOK_SECRET nên trang quản trị sẽ từ chối.");
  }

  return fetch(`${BASE}${path}`, {
    ...init,
    // đơn hàng đổi từng giây, không có gì ở đây được phép đọc từ bộ đệm
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-Storefront-Secret": WEBHOOK_SECRET,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

/** Tài khoản khách để lại để nhận hoàn tiền nếu mẫu in bị từ chối. */
export type RefundAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
};

/**
 * Tạo đơn bên quản trị. Chỉ gửi id biến thể, số lượng và mã mẫu in — giá do bên
 * đó tự tính lại từ cơ sở dữ liệu, nên hai bên không thể lệch giá.
 */
export async function pushOrder(
  customer: CustomerInfo,
  cart: PricedCart,
  method: PaymentMethodKey = "bank_transfer",
  refund?: RefundAccount | null,
): Promise<WarehouseResult> {
  if (!isWarehouseConfigured()) {
    return {
      ok: false,
      error: "Chưa cấu hình WAREHOUSE_API_URL nên không gửi được đơn sang trang quản trị.",
      outOfStock: false,
    };
  }

  const payload = {
    customer_name: customer.fullName,
    customer_phone: customer.phone,
    customer_email: customer.email || null,
    province: customer.city,
    ward: customer.ward,
    address: customer.address,
    note: customer.note || null,
    // Trang quản trị nhận "banking" hoặc "cod"; nó tự tính phí giao hàng và hạn
    // thanh toán theo mã này, nên gửi sai là đơn ghi sai tiền.
    payment_method: method === "cod" ? "cod" : "banking",
    // Các mẫu áo in trong đơn. Chỉ gửi MÃ — giá của chúng đã đóng băng bên quản
    // trị từ lúc khách chốt thiết kế, và bên đó đọc lại chứ không nhận số từ đây.
    print_design_codes: cart.prints.map((p) => p.code),
    // Chỗ trả tiền về nếu shop từ chối thiết kế. Hỏi trước lúc đặt rẻ hơn nhiều
    // so với gọi điện đòi số tài khoản khi khách đang bực.
    refund_bank_name: refund?.bankName || null,
    refund_account_number: refund?.accountNumber || null,
    refund_account_name: refund?.accountName || null,
    items: cart.lines.map((line) => ({
      // id này là id biến thể bên quản trị, web đọc thẳng từ đó nên luôn khớp
      variant_id: Number(line.id),
      quantity: line.qty,
    })),
  };

  if (payload.items.some((item) => !Number.isInteger(item.variant_id))) {
    return {
      ok: false,
      error:
        "Giỏ hàng còn sản phẩm từ phiên bản cũ của cửa hàng. Xoá giỏ và chọn lại giúp mình nhé.",
      outOfStock: false,
    };
  }

  try {
    const response = await warehouseFetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as
      | {
          success?: boolean;
          order_code?: string;
          total_amount?: number;
          error?: string;
          errors?: Record<string, string[]>;
        }
      | null;

    if (!response.ok || !data?.order_code) {
      const validation = data?.errors ? Object.values(data.errors).flat().join(" ") : undefined;
      const message =
        data?.error ?? validation ?? `Trang quản trị trả về HTTP ${response.status}.`;

      // 422 là lỗi nghiệp vụ — gần như luôn là hết hàng, cần nói thẳng cho khách.
      return { ok: false, error: message, outOfStock: response.status === 422 };
    }

    return { ok: true, orderCode: data.order_code, total: data.total_amount ?? cart.total };
  } catch (error) {
    console.error("[warehouse] không gửi được đơn", error);
    return {
      ok: false,
      error: "Không kết nối được tới trang quản trị. Vui lòng thử lại.",
      outOfStock: false,
    };
  }
}

/**
 * Chuyển một phiên thanh toán đã PAID thành Invoice trong trang quản trị.
 * Laravel khoá StorefrontOrder, nên webhook PayOS và lượt poll có gọi song song
 * cũng chỉ tạo duy nhất một đơn.
 */
export async function fulfillPaidOrder(ref: string): Promise<WarehouseFulfillmentResult> {
  try {
    const response = await warehouseFetch(`/api/storefront/orders/${encodeURIComponent(ref)}/fulfill`, {
      method: "POST",
    });
    const data = (await response.json().catch(() => null)) as { order_code?: string; error?: string } | null;

    if (!response.ok || !data?.order_code) {
      return {
        ok: false,
        error: data?.error ?? `Trang quản trị trả về HTTP ${response.status} khi hoàn tất đơn.`,
      };
    }

    return { ok: true, orderCode: data.order_code };
  } catch (error) {
    console.error("[warehouse] không hoàn tất được đơn đã thanh toán", error);
    return { ok: false, error: "Không kết nối được tới trang quản trị." };
  }
}

/**
 * Endpoint tương thích cho các luồng cũ đã có mã Invoice.
 * Đơn PayOS mới dùng fulfillPaidOrder để tạo Invoice sau khi nhận thanh toán.
 */
export async function markPaid(orderCode: string): Promise<boolean> {
  if (!isWarehouseConfigured()) return false;

  // Thiếu bí mật thì trang quản trị sẽ trả 401; báo rõ ở đây để khỏi phải đi mò log.
  if (!WEBHOOK_SECRET) {
    console.error("[warehouse] thiếu WAREHOUSE_WEBHOOK_SECRET — không báo được đã thanh toán");
    return false;
  }

  try {
    const response = await fetch(`${BASE}/api/checkout/${encodeURIComponent(orderCode)}/paid`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-Storefront-Secret": WEBHOOK_SECRET,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(`[warehouse] báo đã thanh toán thất bại: HTTP ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[warehouse] báo đã thanh toán thất bại", error);
    return false;
  }
}
