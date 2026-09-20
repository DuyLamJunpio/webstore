/**
 * Reconciling a stored order with SePay.
 *
 * SePay calls the webhook when money arrives. The payment page only reads the
 * stored state; it never polls a payment provider or exposes a secret token.
 */

import { sendOrderConfirmation } from "./order-email";
import { updateOrder, type Order } from "./orders";
import type { PaymentStatus } from "./payment-status";
import { fulfillPaidOrder } from "./warehouse";

/**
 * Statuses worth another round trip.
 *
 * UNDERPAID is in here on purpose: SePay transactions are accumulated, so a
 * shopper who transferred too little can send the rest and still reach PAID.
 */
const OPEN: PaymentStatus[] = ["PENDING", "PROCESSING", "UNDERPAID"];

export const isOpen = (status: PaymentStatus) => OPEN.includes(status);

/** Tạo Invoice quản trị khi, và chỉ khi, tiền đã về. */
async function fulfillWarehouseOrder(order: Order): Promise<Order> {
  if (order.warehouseOrderCode) return order;

  const warehouse = await fulfillPaidOrder(order.ref);
  if (!warehouse.ok) {
    // Trạng thái PAID vẫn là sự thật; lần poll/webhook sau sẽ thử hoàn tất lại.
    console.error(`[order-status] không hoàn tất được đơn ${order.ref}: ${warehouse.error}`);
    return order;
  }

  try {
    return (await updateOrder(order.ref, { warehouseOrderCode: warehouse.orderCode })) ?? {
      ...order,
      warehouseOrderCode: warehouse.orderCode,
    };
  } catch (error) {
    // Laravel khoá idempotency, nên lần sau gọi lại chỉ nhận mã đơn cũ.
    console.error(`[order-status] không lưu được mã đơn quản trị của ${order.ref}`, error);
    return { ...order, warehouseOrderCode: warehouse.orderCode };
  }
}

export async function syncOrderStatus(order: Order): Promise<Order> {
  /**
   * Đơn trả khi nhận hàng không có gì để đối soát: không có liên kết thanh toán
   * nào bên SePay, và tiền chỉ về khi người giao hàng thu hộ. Hỏi cổng thanh
   * toán về nó chỉ tổ nhận lỗi rồi ghi đè trạng thái bằng một câu trả lời sai.
   */
  if (order.paymentMethod === "cod") {
    if (!order.confirmationEmailSentAt) await sendOrderConfirmation(order);
    return order;
  }

  if (!isOpen(order.status)) {
    /**
     * Đơn đã chốt thì không hỏi SePay nữa — nhưng vẫn phải thử gửi lại thư khi
     * lần trước trượt.
     *
     * Không có nhánh này thì một lá thư gửi hỏng là mất vĩnh viễn: webhook chỉ
     * gọi một lần, còn nhánh dưới thì đã bị `return` chặn từ đây. Cũng chính là
     * đường để những đơn thanh toán trước lúc cấu hình email nhận được thư.
     */
    if (order.status === "PAID") {
      if (!order.confirmationEmailSentAt) await sendOrderConfirmation(order);
      return fulfillWarehouseOrder(order);
    }
    return order;
  }

  if (Date.now() <= order.expiresAt) return order;

  try {
    return (await updateOrder(order.ref, { status: "EXPIRED" })) ?? order;
  } catch (error) {
    // Ghi được hay không thì QR cũng đã hết hạn; nói thật với khách đang xem
    // trang, còn webhook SePay đến muộn sẽ được kho ghi để nhân viên tra soát.
    console.error(`[order-status] không ghi được hạn của ${order.ref}`, error);
    return { ...order, status: "EXPIRED" };
  }
}
