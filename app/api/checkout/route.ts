/**
 * POST /api/checkout — turn a guest cart into an order with a bank-transfer QR.
 *
 * The request body may only name variants and quantities. Prices, stock limits,
 * shipping and the VND total are all recomputed here from the catalogue, so a
 * hand-edited localStorage cart cannot buy a jacket for a dollar.
 */

import { getCatalogue } from "@/lib/catalogue";
import { getContent } from "@/lib/content";
import type { PaymentMethodKey } from "@/lib/sales";
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
  type PricedPrint,
} from "@/lib/checkout";
import { fetchPrintDesign, printLineLabel } from "@/lib/print-order";
import { reserveOrder, saveOrder, type Order, type OrderPayment } from "@/lib/orders";
import { createPaymentLink, DESCRIPTION_MAX, isPayosConfigured, PayosError } from "@/lib/payos";
import { buildVietQr, readFallbackBank } from "@/lib/vietqr";
import { pushOrder } from "@/lib/warehouse";

// ── a small brake on a public endpoint that calls a paid API ─────────

/** Đơn trả khi nhận hàng không có hạn thanh toán; con số này chỉ để lấp chỗ. */
const COD_WINDOW_DAYS = 30;

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

type Body = {
  lines?: CheckoutLine[];
  customer?: Partial<CustomerInfo>;
  paymentMethod?: string;
  /** mã các mẫu áo khách đã thiết kế ở /in-ao; giá đọc lại từ trang quản trị */
  printCodes?: string[];
  /** tài khoản nhận hoàn tiền, chỉ hỏi khi đơn có mẫu in */
  refund?: { bankName?: string; accountNumber?: string; accountName?: string };
};

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

  // Cài đặt bán hàng lấy lại từ trang quản trị chứ không tin phía trình duyệt:
  // phí giao hàng và việc hình thức thanh toán có đang mở hay không đều là tiền.
  const { sales } = await getContent();
  const method: PaymentMethodKey = body.paymentMethod === "cod" ? "cod" : "bank_transfer";

  if (!sales[method].enabled) {
    return bad("Hình thức thanh toán này đang tạm ngưng. Vui lòng chọn cách khác.", 503);
  }

  /*
   * Mẫu áo in: đọc lại từ trang quản trị để lấy GIÁ ĐÃ ĐÓNG BĂNG. Trình duyệt
   * chỉ được nói mã, không được nói tiền — cùng nguyên tắc với `priceCart`.
   */
  const codes = Array.from(new Set(body.printCodes ?? [])).slice(0, 20);
  const prints: PricedPrint[] = [];

  for (const code of codes) {
    const design = await fetchPrintDesign(code);

    if (!design) {
      return bad(`Không tìm thấy mẫu thiết kế ${code}. Vui lòng thiết kế lại.`, 422);
    }
    // Mở lại tab cũ rồi bấm đặt lần nữa là gặp đúng nhánh này.
    if (design.already_ordered) {
      return bad(`Mẫu ${code} đã được đặt rồi. Vui lòng bỏ nó khỏi giỏ và đặt lại.`, 409);
    }

    prints.push({
      code: design.code,
      label: printLineLabel(design),
      qty: design.qty,
      unitPrice: design.unit_price,
      total: design.total_price,
    });
  }

  const priced = priceCart(await getCatalogue(), body.lines ?? [], sales, method, prints);
  if (!priced.ok) return bad(priced.error);
  const cart = priced.cart;

  /*
   * Chỉ giữ thông tin hoàn tiền khi đơn thật sự có mẫu in. Đơn hàng bán sẵn
   * không cần, và lưu số tài khoản mà không có lý do là giữ thừa dữ liệu nhạy cảm.
   */
  const refund = cart.prints.length
    ? {
        bankName: (body.refund?.bankName ?? "").trim().slice(0, 100),
        accountNumber: (body.refund?.accountNumber ?? "").replace(/\s/g, "").slice(0, 40),
        accountName: (body.refund?.accountName ?? "").trim().slice(0, 120),
      }
    : null;

  // Đẩy đơn sang trang quản trị TRƯỚC khi tạo mã QR. Bên đó giữ tồn kho thật và
  // kiểm tra lại một lần nữa, nên hết hàng thì khách biết ngay tại đây chứ không
  // phải sau khi đã chuyển khoản. Tồn kho cũng được trừ ngay từ lúc này.
  const warehouse = await pushOrder(customer, cart, method, refund);
  if (!warehouse.ok) {
    return bad(warehouse.error, warehouse.outOfStock ? 409 : 502);
  }

  /**
   * Từ đây trở đi trang quản trị ĐÃ nhận đơn và đã trừ kho. Hỏng bước nào thì
   * cũng không được để khách bấm lại: mỗi lần bấm là thêm một đơn trùng bên kho.
   * Nên báo kèm mã đơn và nói thẳng là đừng đặt lại.
   */
  const daGhiNhan = (error: unknown) => {
    console.error("[checkout] đơn đã sang kho nhưng không lưu được ở web", error);
    return bad(
      `Đơn hàng của bạn ĐÃ được ghi nhận với mã ${warehouse.orderCode ?? ""}. `
        + "Trang theo dõi đơn tạm thời không mở được — vui lòng KHÔNG đặt lại, shop sẽ liên hệ với bạn.",
      500,
    );
  };

  let ref: string;
  let orderCode: number;
  try {
    ({ ref, orderCode } = await reserveOrder());
  } catch (error) {
    return daGhiNhan(error);
  }
  const createdAt = Date.now();
  let expiresAt = createdAt + PAYMENT_WINDOW_MINUTES * 60 * 1000;

  let payment: OrderPayment;

  if (method === "cod") {
    // Trả tiền khi nhận hàng: không có mã QR, không có đồng hồ đếm ngược. Vẫn đặt
    // một hạn rất xa để mọi chỗ đọc `expiresAt` không phải thêm nhánh riêng.
    expiresAt = createdAt + COD_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    payment = {
      provider: "cod",
      bin: "",
      accountNumber: "",
      accountName: "",
      amount: cart.total,
      description: "",
      qrCode: "",
    };
  } else if (isPayosConfigured()) {
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
    paymentMethod: method,
    // Mã đơn bên trang quản trị, để webhook báo "đã nhận tiền" đúng đơn.
    warehouseOrderCode: warehouse.orderCode,
  };
  try {
    await saveOrder(order);
  } catch (error) {
    return daGhiNhan(error);
  }

  return Response.json({ ref, url: `/checkout/${ref}` }, { status: 201 });
}
