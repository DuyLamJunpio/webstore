/**
 * POST /api/sepay/webhook — SePay reports a bank transfer.
 *
 * SePay retries non-2xx responses. We therefore return 200 for a valid but
 * irrelevant transfer, while failures talking to the order store return 500 so
 * the same signed notification is delivered again.
 */

import { after } from "next/server";
import { sendOrderConfirmation } from "@/lib/order-email";
import type { Order } from "@/lib/orders";
import {
  asVnd,
  findSepayOrder,
  hasValidSepayAuthorization,
  readSepayWebhookConfig,
  sepayPaymentRefs,
  type SepayWebhook,
} from "@/lib/sepay";
import { fulfillPaidOrder, recordSepayPayment } from "@/lib/warehouse";

/**
 * 200 so SePay stops retrying — but say why in the log. Without this line a
 * transfer SePay could not read looks exactly like SePay never calling.
 */
function ignored(reason: string, transactionId: unknown): Response {
  console.info(`[sepay] bỏ qua giao dịch ${String(transactionId)}: ${reason}`);
  return Response.json({ success: true, ignored: reason });
}

export async function GET() {
  return Response.json({ success: true });
}

export async function POST(request: Request) {
  const config = readSepayWebhookConfig();
  if (!config) {
    console.error("[sepay] thiếu cấu hình SePay");
    return Response.json({ success: false, error: "Chưa cấu hình SePay." }, { status: 503 });
  }

  if (!hasValidSepayAuthorization(request, config)) {
    console.warn("[sepay] từ chối webhook sai API key");
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as SepayWebhook | null;
  if (!body) return Response.json({ success: false, error: "Bad payload" }, { status: 400 });
  if (body.transferType?.toLowerCase() !== "in") return ignored("not_an_incoming_transfer", body.id);

  const transactionId = Number(body.id);
  const amount = asVnd(body.transferAmount);
  if (!Number.isSafeInteger(transactionId) || transactionId < 1 || !amount) {
    return ignored("incomplete_transfer", body.id);
  }

  const refs = sepayPaymentRefs(body, config);
  if (refs.length === 0) return ignored("no_payment_code", transactionId);

  const order = await findSepayOrder(refs, config);
  if (!order) return ignored("unknown_order", transactionId);

  const recorded = await recordSepayPayment(order.ref, {
    id: transactionId,
    amount,
    reference: typeof body.referenceCode === "string" ? body.referenceCode : null,
  });
  if (!recorded.ok) {
    console.error(`[sepay] không ghi nhận được giao dịch ${transactionId} cho đơn ${order.ref}: ${recorded.error}`);
    // A mismatch will not become valid on retry; infrastructure failures should.
    return Response.json(
      { success: !recorded.retryable, error: recorded.error },
      { status: recorded.retryable ? 500 : 200 },
    );
  }

  if (recorded.order.ignored) {
    // The money is in the account but the QR had already closed, so no order follows.
    console.warn(`[sepay] giao dịch ${transactionId} về sau khi đơn ${order.ref} đã đóng — cần đối soát tay`);
  }

  const settled = recorded.order as Order;
  if (settled.status === "PAID") {
    after(async () => {
      await Promise.all([sendOrderConfirmation(settled), fulfillPaidOrder(settled.ref)]);
    });
  }

  return Response.json({ success: true });
}
