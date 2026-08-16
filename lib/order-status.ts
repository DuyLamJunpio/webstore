/**
 * Reconciling a stored order with PayOS.
 *
 * Both the payment page (a server component) and the polling endpoint need the
 * same answer, and both must be able to give one when PayOS is unreachable —
 * a payment gateway hiccup should not turn into a 500 on the page a shopper is
 * staring at while their money is in flight. On failure the stored status is
 * returned unchanged and the next poll tries again.
 */

import { updateOrder, type Order } from "./orders";
import { getPaymentLink, isPayosConfigured, type PaymentStatus } from "./payos";

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
  if (!isOpen(order.status)) return order;

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

    return (await updateOrder(order.ref, patch)) ?? { ...order, ...patch };
  } catch (error) {
    console.error(`[order-status] PayOS lookup failed for ${order.ref}`, error);
    // PayOS also expires the link its side; this only keeps the UI honest meanwhile
    if (Date.now() > order.expiresAt) return { ...order, status: "EXPIRED" };
    return order;
  }
}
