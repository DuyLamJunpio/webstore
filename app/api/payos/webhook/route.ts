/**
 * POST /api/payos/webhook — PayOS tells us a transfer landed.
 *
 * This URL is public, so the signature check is the only thing standing between
 * a stranger and a free jacket. Nothing is written before `verifyWebhook`
 * returns a payload, and the amount is checked against the stored order too.
 *
 * Register it once from the PayOS dashboard, or:
 *   curl -X POST http://localhost:3000/api/payos/webhook   (returns 200, no-op)
 *   PayOS → Kênh thanh toán → Webhook → https://your-domain/api/payos/webhook
 *
 * PayOS retries on any non-2xx, so anything we simply do not recognise still
 * answers 200 — retrying will not make an unknown order code known.
 */

import { after } from "next/server";
import type { NextRequest } from "next/server";
import { sendOrderConfirmation } from "@/lib/order-email";
import { getOrderByCode, updateOrder } from "@/lib/orders";
import { verifyWebhook, type WebhookBody } from "@/lib/payos";
import { markPaid } from "@/lib/warehouse";

/** PayOS pings the URL with a dummy payload when you register it */
export async function GET() {
  return Response.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as WebhookBody | null;
  if (!body) return Response.json({ error: "Bad payload" }, { status: 400 });

  const data = verifyWebhook(body);
  if (!data) {
    console.warn("[payos] rejected a webhook with an invalid signature");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  // the registration ping carries orderCode 123 and never matches a real order
  const order = await getOrderByCode(data.orderCode);
  if (!order) {
    return Response.json({ ok: true, ignored: "unknown order" });
  }

  if (order.status === "PAID") return Response.json({ ok: true });

  // "00" is the transaction-level success code; the envelope's is separate
  const succeeded = body.success === true || data.code === "00";
  if (!succeeded) {
    console.warn(`[payos] transfer for ${order.ref} reported ${data.code}: ${data.desc}`);
    return Response.json({ ok: true });
  }

  if (data.amount < order.payment.amount) {
    // Short transfer. PayOS keeps the link open and calls this UNDERPAID, so
    // record it and let the shopper send the rest — but never fulfil on it.
    console.warn(
      `[payos] ${order.ref} underpaid: received ${data.amount}, expected ${order.payment.amount}`,
    );
    await updateOrder(order.ref, { status: "UNDERPAID", amountPaid: data.amount });
    return Response.json({ ok: true, ignored: "amount mismatch" });
  }

  const paid = await updateOrder(order.ref, {
    status: "PAID",
    paidAt: Date.now(),
    amountPaid: data.amount,
    transactionRef: data.reference,
  });
  console.log(`[payos] order ${order.ref} paid — ${data.reference}`);

  // Gửi thư sau khi đã trả lời PayOS: máy chủ email chậm hoặc chết cũng không
  // được phép làm request này quá hạn, vì PayOS coi mọi phản hồi khác 2XX là
  // thất bại và sẽ gọi lại.
  if (paid) after(() => sendOrderConfirmation(paid));

  // Báo cho trang quản trị biết đã nhận được tiền. Cũng chạy sau khi đã trả lời
  // PayOS, và thất bại cũng không sao: nhân viên vẫn đối chiếu và xác nhận tay.
  const warehouseCode = paid?.warehouseOrderCode;
  if (warehouseCode) after(() => markPaid(warehouseCode));

  return Response.json({ ok: true });
}
