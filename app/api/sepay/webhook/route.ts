/**
 * POST /api/sepay/webhook — SePay reports a bank transfer.
 *
 * SePay retries non-2xx responses. We therefore return 200 for a valid but
 * irrelevant transfer, while failures talking to the order store return 500 so
 * the same signed notification is delivered again.
 */

import { after } from "next/server";
import { sendOrderConfirmation } from "@/lib/order-email";
import { getOrder, type Order } from "@/lib/orders";
import {
  asVnd,
  hasValidSepayAuthorization,
  readSepayWebhookConfig,
  sepayPaymentCode,
  type SepayWebhook,
} from "@/lib/sepay";
import { fulfillPaidOrder, recordSepayPayment } from "@/lib/warehouse";

const REF_PATTERN = /^[A-Za-z0-9]{1,32}$/;

const ignored = (reason: string) => Response.json({ success: true, ignored: reason });

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
  if (body.transferType?.toLowerCase() !== "in") return ignored("not_an_incoming_transfer");

  const transactionId = Number(body.id);
  const amount = asVnd(body.transferAmount);
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!Number.isSafeInteger(transactionId) || transactionId < 1 || !amount || !code) {
    return ignored("incomplete_transfer");
  }

  if (!code.startsWith(config.paymentPrefix)) return ignored("different_payment_prefix");
  const ref = code.slice(config.paymentPrefix.length);
  if (!REF_PATTERN.test(ref)) return ignored("invalid_payment_code");

  const order = await getOrder(ref);
  if (!order || order.payment.provider !== "sepay" || order.payment.description !== sepayPaymentCode(ref, config)) {
    return ignored("unknown_order");
  }

  const recorded = await recordSepayPayment(ref, {
    id: transactionId,
    amount,
    reference: typeof body.referenceCode === "string" ? body.referenceCode : null,
  });
  if (!recorded.ok) {
    // A mismatch will not become valid on retry; infrastructure failures should.
    return Response.json(
      { success: !recorded.retryable, error: recorded.error },
      { status: recorded.retryable ? 500 : 200 },
    );
  }

  const settled = recorded.order as Order;
  if (settled.status === "PAID") {
    after(async () => {
      await Promise.all([sendOrderConfirmation(settled), fulfillPaidOrder(settled.ref)]);
    });
  }

  return Response.json({ success: true });
}
