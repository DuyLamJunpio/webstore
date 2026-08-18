/**
 * Đẩy đơn hàng sang trang quản trị (Laravel).
 *
 * Trang quản trị mới là nơi giữ tồn kho thật. Đơn được đẩy sang NGAY khi khách
 * bấm thanh toán, trước khi tạo mã QR, vì hai lý do:
 *
 *   1. Trang quản trị kiểm tra lại tồn và trừ kho. Hết hàng thì khách biết ngay
 *      thay vì chuyển khoản xong mới báo không còn hàng.
 *   2. Nhân viên nhìn thấy đơn đang chờ, kể cả khi khách bỏ ngang không trả tiền.
 *
 * Đơn nằm ở trạng thái "chờ xác nhận" và "chưa thanh toán" cho tới khi nhận
 * được tiền. Khách bỏ ngang thì nhân viên huỷ đơn bên quản trị, hàng tự được
 * cộng trả về kho.
 */

import type { CustomerInfo, PricedCart } from "./checkout";

const BASE = (process.env.WAREHOUSE_API_URL ?? "").replace(/\/$/, "");

export const isWarehouseConfigured = () => BASE.length > 0;

export type WarehouseResult =
  | { ok: true; orderCode: string; total: number }
  | { ok: false; error: string; outOfStock: boolean };

const TIMEOUT_MS = 15_000;

/**
 * Bí mật dùng chung với trang quản trị. Chỉ dùng cho endpoint báo đã thanh toán:
 * endpoint đó đổi trạng thái tiền bạc, mà chính khách đặt hàng cũng biết mã đơn
 * của mình, nên nếu không xác thực thì họ tự đánh dấu "đã trả tiền" được.
 */
const WEBHOOK_SECRET = process.env.WAREHOUSE_WEBHOOK_SECRET ?? "";

/**
 * Tạo đơn bên quản trị. Chỉ gửi id biến thể và số lượng — giá do bên đó tự
 * tính lại từ cơ sở dữ liệu, nên hai bên không thể lệch giá.
 */
export async function pushOrder(
  customer: CustomerInfo,
  cart: PricedCart,
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
    payment_method: "banking",
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
    const response = await fetch(`${BASE}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
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
 * Báo cho trang quản trị biết đã nhận được tiền.
 * Gọi sau khi PayOS xác nhận, không chặn luồng nào — thất bại thì chỉ ghi log,
 * nhân viên vẫn xác nhận tay được.
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
