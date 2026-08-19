/**
 * POST /api/orders/status-mail — trang quản trị báo một đơn vừa đổi trạng thái.
 *
 * Thư đi từ đây chứ không từ Laravel vì mọi thứ cần để gửi đều đã ở đây: tài
 * khoản SMTP, mẫu thư theo nhận diện của shop, và cách gọt lời cho từng bước.
 * Bên kho chỉ cần nói "đơn này vừa sang trạng thái kia".
 *
 * Dữ liệu gửi lên là snake_case theo đúng lối Laravel; chỗ này chuẩn hoá về
 * camelCase một lần rồi phần còn lại của web không phải biết tới hai lối viết.
 * Cũng cố ý không tin gì từ thân request: thiếu hoặc sai thì thay bằng giá trị
 * an toàn, vì một lá thư hiện "NaN đồng" còn tệ hơn một lá thư thiếu số.
 */

import {
  isOrderStatus,
  sendOrderStatusMail,
  type StatusMail,
  type StatusMailLine,
} from "@/lib/order-status-email";
import { rejectUnlessWarehouse } from "@/lib/warehouse-auth";

const text = (value: unknown, max = 255): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/** Số nguyên dương; mọi thứ khác về 0. */
const money = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
};

const readLines = (value: unknown): StatusMailLine[] => {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 100).map((raw) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    return {
      name: text(item.name, 200) || "Sản phẩm",
      variant: text(item.variant, 100),
      quantity: Math.max(1, money(item.quantity)),
      total: money(item.total),
    };
  });
};

export async function POST(request: Request) {
  const rejected = rejectUnlessWarehouse(request, "status-mail");
  if (rejected) return rejected;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });

  const orderCode = text(body.order_code, 64);
  if (!orderCode) return Response.json({ error: "Thiếu mã đơn hàng." }, { status: 422 });

  if (!isOrderStatus(body.status)) {
    return Response.json({ error: "Trạng thái đơn hàng không hợp lệ." }, { status: 422 });
  }

  const customer = (body.customer ?? {}) as Record<string, unknown>;
  const email = text(customer.email, 255);

  /*
   * Đơn không có email thì không có gì để gửi, và đó là chuyện thường: khách mua
   * ngay tại cửa hàng không phải để lại email. Trả 200 để bên kho không ghi đây
   * thành lỗi — không phải đơn nào cũng có người cần nhận thư.
   */
  if (!email) {
    return Response.json({ sent: false, reason: "đơn không có email" });
  }

  const changedAt = money(body.changed_at);

  const mail: StatusMail = {
    orderCode,
    status: body.status,
    previousStatus: isOrderStatus(body.previous_status) ? body.previous_status : null,
    // Thiếu hoặc sai thì lấy giờ nhận được tin: thư luôn phải nói được "cập nhật lúc".
    changedAt: changedAt > 0 ? changedAt : Date.now(),
    paid: body.paid === true,
    paymentMethod: body.payment_method === "cod" ? "cod" : "banking",
    customer: {
      name: text(customer.name) || "Quý khách",
      email,
      phone: text(customer.phone, 32),
      address: text(customer.address, 500),
    },
    note: text(body.note, 1000) || null,
    subtotal: money(body.subtotal),
    shipping: money(body.shipping),
    total: money(body.total),
    lines: readLines(body.items),
  };

  const sent = await sendOrderStatusMail(mail);

  /*
   * 200 kể cả khi thư không đi được: bên kho đã đổi trạng thái xong rồi, và nó
   * không có cách nào sửa được một máy chủ SMTP đang hỏng. Lý do thật nằm ở log
   * của `sendOrderStatusMail`.
   */
  return Response.json({ sent });
}
