/**
 * POST /api/checkout — turn a guest cart into an order with a bank-transfer QR.
 *
 * The request body may only name variants and quantities. Prices, stock limits,
 * shipping and the VND total are all recomputed here from the catalogue, so a
 * hand-edited localStorage cart cannot buy a jacket for a dollar.
 */

import { after } from "next/server";
import type { NextRequest } from "next/server";
import {
  cleanCustomer,
  EMPTY_CUSTOMER,
  formatAddress,
  PAYMENT_WINDOW_MINUTES,
  priceCart,
  validateCustomer,
  type CheckoutLine,
  type CustomerInfo,
} from "@/lib/checkout";
import { reserveOrder, saveOrder, type Order, type OrderPayment } from "@/lib/orders";
import { createPaymentLink, DESCRIPTION_MAX, isPayosConfigured, PayosError } from "@/lib/payos";
import { buildVietQr, readFallbackBank } from "@/lib/vietqr";

// ── a small brake on a public endpoint that calls a paid API ─────────

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 12;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((at) => now - at < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > RATE_MAX;
}

/** the map is per-process and tiny, but it should not grow unbounded either */
function sweepRateLimiter() {
  const now = Date.now();
  for (const [key, stamps] of hits) {
    if (stamps.every((at) => now - at >= RATE_WINDOW_MS)) hits.delete(key);
  }
}

const clientIp = (request: NextRequest) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  request.headers.get("x-real-ip") ||
  "unknown";

// ── request body ─────────────────────────────────────────────────────

type Body = { lines?: CheckoutLine[]; customer?: Partial<CustomerInfo> };

const bad = (error: string, status = 400, extra: Record<string, unknown> = {}) =>
  Response.json({ error, ...extra }, { status });

function siteUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  // behind a proxy the request URL is the internal one, so prefer the forwarded host
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : new URL(request.url).origin;
}

export async function POST(request: NextRequest) {
  if (rateLimited(clientIp(request))) {
    return bad("Bạn vừa tạo quá nhiều đơn hàng. Vui lòng thử lại sau ít phút.", 429);
  }
  after(sweepRateLimiter);

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body) return bad("Dữ liệu gửi lên không hợp lệ.");

  const customer = cleanCustomer({ ...EMPTY_CUSTOMER, ...body.customer });
  const fieldErrors = validateCustomer(customer);
  if (Object.keys(fieldErrors).length > 0) {
    return bad("Vui lòng kiểm tra lại thông tin nhận hàng.", 400, { fieldErrors });
  }

  const priced = priceCart(body.lines ?? []);
  if (!priced.ok) return bad(priced.error);
  const cart = priced.cart;

  const { ref, orderCode } = await reserveOrder();
  const createdAt = Date.now();
  let expiresAt = createdAt + PAYMENT_WINDOW_MINUTES * 60 * 1000;

  let payment: OrderPayment;

  if (isPayosConfigured()) {
    const origin = siteUrl(request);
    // PayOS allows nine characters when the shop is on a plain bank account, so
    // the memo carries the tail of the order code rather than the full ref.
    // Nothing depends on it: the webhook matches on the whole orderCode.
    const description = `TBC${String(orderCode).slice(-(DESCRIPTION_MAX - 3))}`;

    try {
      const link = await createPaymentLink({
        orderCode,
        amount: cart.total,
        description,
        returnUrl: `${origin}/checkout/${ref}`,
        cancelUrl: `${origin}/checkout/${ref}?huy=1`,
        items: cart.lines.map((line) => ({
          name: `${line.name} (${line.color}/${line.size})`.slice(0, 100),
          quantity: line.qty,
          price: line.unitPrice,
        })),
        buyerName: customer.fullName,
        buyerEmail: customer.email || undefined,
        buyerPhone: customer.phone,
        buyerAddress: formatAddress(customer),
        expiredAt: Math.floor(expiresAt / 1000),
      });

      payment = {
        provider: "payos",
        bin: link.bin,
        accountNumber: link.accountNumber,
        accountName: link.accountName,
        amount: link.amount,
        // PayOS may prefix its own matching code, so its description wins over ours
        description: link.description || description,
        qrCode: link.qrCode,
        checkoutUrl: link.checkoutUrl,
        paymentLinkId: link.paymentLinkId,
      };

      // PayOS is the one enforcing the deadline, so its answer beats our clock
      if (link.expiredAt) expiresAt = link.expiredAt * 1000;
    } catch (error) {
      const message =
        error instanceof PayosError ? error.message : "Không tạo được liên kết thanh toán.";
      console.error("[checkout] PayOS create failed", error);
      return bad(message, 502);
    }
  } else {
    // no merchant keys yet — fall back to the shop's own account so the flow is testable
    const bank = readFallbackBank();
    if (!bank) {
      return bad(
        "Cổng thanh toán chưa được cấu hình. Vui lòng đặt PAYOS_CLIENT_ID, PAYOS_API_KEY và PAYOS_CHECKSUM_KEY.",
        503,
      );
    }

    // our own QR, so no nine-character ceiling — spell the ref out in full,
    // because reconciling this one is somebody reading a bank statement
    const description = `TBC ${ref}`;

    payment = {
      provider: "fallback",
      bin: bank.bin,
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      amount: cart.total,
      description,
      qrCode: buildVietQr({
        bin: bank.bin,
        accountNumber: bank.accountNumber,
        amount: cart.total,
        addInfo: description,
      }),
    };
  }

  const order: Order = {
    ref,
    orderCode,
    createdAt,
    expiresAt,
    status: "PENDING",
    customer,
    cart,
    payment,
  };
  await saveOrder(order);

  return Response.json({ ref, url: `/checkout/${ref}` }, { status: 201 });
}
