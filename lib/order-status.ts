/**
 * Reconciling a stored order with PayOS.
 *
 * Both the payment page (a server component) and the polling endpoint need the
 * same answer, and both must be able to give one when PayOS is unreachable —
 * a payment gateway hiccup should not turn into a 500 on the page a shopper is
 * staring at while their money is in flight. On failure the stored status is
 * returned unchanged and the next poll tries again.
 */

import { sendOrderConfirmation } from "./order-email";
import { updateOrder, type Order } from "./orders";
import { getPaymentLink, isPayosConfigured, type PaymentStatus } from "./payos";
import { markPaid } from "./warehouse";

/**
 * Statuses worth another round trip.
 *
 * UNDERPAID is in here on purpose: PayOS keeps the link open and tracks
 * `amountRemaining`, so a shopper who transferred too little can send the rest
 * and the order still reaches PAID. Treating it as final would strand them.
 */
const OPEN: PaymentStatus[] = ["PENDING", "PROCESSING", "UNDERPAID"];

export const isOpen = (status: PaymentStatus) => OPEN.includes(status);

export async function syncOrderStatus(order: Order): Promise<Order> {
  /**
   * Đơn trả khi nhận hàng không có gì để đối soát: không có liên kết thanh toán
   * nào bên PayOS, và tiền chỉ về khi người giao hàng thu hộ. Hỏi cổng thanh
   * toán về nó chỉ tổ nhận lỗi rồi ghi đè trạng thái bằng một câu trả lời sai.
   */
  if (order.paymentMethod === "cod") {
    if (!order.confirmationEmailSentAt) await sendOrderConfirmation(order);
    return order;
  }

  if (!isOpen(order.status)) {
    /**
     * Đơn đã chốt thì không hỏi PayOS nữa — nhưng vẫn phải thử gửi lại thư khi
     * lần trước trượt.
     *
     * Không có nhánh này thì một lá thư gửi hỏng là mất vĩnh viễn: webhook chỉ
     * gọi một lần, còn nhánh dưới thì đã bị `return` chặn từ đây. Cũng chính là
     * đường để những đơn thanh toán trước lúc cấu hình email nhận được thư.
     */
    if (order.status === "PAID" && !order.confirmationEmailSentAt) {
      await sendOrderConfirmation(order);
    }
    return order;
  }

  // no merchant keys: the QR is the shop's own account, so nobody is watching it
  if (order.payment.provider !== "payos" || !isPayosConfigured()) {
    return Date.now() > order.expiresAt
      ? ((await updateOrder(order.ref, { status: "EXPIRED" })) ?? order)
      : order;
  }

  try {
    const link = await getPaymentLink(order.orderCode);

    const patch: Partial<Order> = { status: link.status, amountPaid: link.amountPaid };
    if (link.status === "PAID" && order.status !== "PAID") {
      patch.paidAt = Date.now();
      patch.transactionRef = link.transactions?.[0]?.reference;
    }

    const unchanged = link.status === order.status && link.amountPaid === order.amountPaid;
    if (unchanged) return order;

    const next = (await updateOrder(order.ref, patch)) ?? { ...order, ...patch };

    /**
     * Đường dự phòng cho thư xác nhận, khi webhook không tới được máy chủ này
     * (chạy localhost sau NAT, tunnel đã tắt, hoặc PayOS gọi hụt).
     *
     * Cố ý `await` chứ không dùng `after()`: hàm này còn được gọi từ server
     * component của trang thanh toán, nơi `after()` không phải lúc nào cũng
     * chạy tới nơi. Bên trong đã tự chống gửi trùng nên webhook và vòng poll
     * cùng chạy vẫn chỉ ra đúng một lá thư.
     */
    if (next.status === "PAID") {
      await sendOrderConfirmation(next);

      /**
       * Trang quản trị cũng phải được báo từ nhánh này, không chỉ từ webhook.
       *
       * Webhook chỉ tới được khi PayOS gọi được vào deployment; chạy localhost
       * sau NAT thì không bao giờ. Nếu chỉ webhook mới báo sang quản trị, đơn
       * bên đó vẫn là "chưa thanh toán" và lệnh orders:cancel-expired sẽ tự huỷ
       * nó sau 30 phút — trả hàng về kho dù khách đã trả tiền thật.
       *
       * Gọi trùng không sao: bên quản trị trả về "đã ghi nhận trước đó".
       */
      if (next.warehouseOrderCode) await markPaid(next.warehouseOrderCode);
    }

    return next;
  } catch (error) {
    console.error(`[order-status] PayOS lookup failed for ${order.ref}`, error);
    // PayOS also expires the link its side; this only keeps the UI honest meanwhile
    if (Date.now() > order.expiresAt) return { ...order, status: "EXPIRED" };
    return order;
  }
}
