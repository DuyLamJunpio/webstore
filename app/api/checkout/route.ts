/**
 * POST /api/checkout — turn a guest cart into an order with a bank-transfer QR.
 *
 * The request body may only name variants and quantities. Prices, stock limits,
 * shipping and the VND total are all recomputed here from the catalogue, so a
 * hand-edited localStorage cart cannot buy a jacket for a dollar.
 */

import { getCatalogue } from "@/lib/catalogue";
import { getContent } from "@/lib/content";
import { CONTACT } from "@/lib/contact";
import { BULK_PRINT_FROM, isBulkPrint } from "@/lib/print-bulk";
import { PHUONG_THUC_CHO_DON_IN, TEN_PHUONG_THUC, type PaymentMethodKey } from "@/lib/sales";
import { after } from "next/server";
import type { NextRequest } from "next/server";
import {
  cleanCustomer,
  EMPTY_CUSTOMER,
  PAYMENT_WINDOW_MINUTES,
  applyVoucherQuote,
  priceCart,
  validateCustomer,
  type CheckoutLine,
  type CustomerInfo,
  type PricedPrint,
} from "@/lib/checkout";
import { fetchPrintDesign, printLineLabel } from "@/lib/print-order";
import { reserveOrder, saveOrder, type Order, type OrderPayment } from "@/lib/orders";
import { getSepayBankAccount, readSepayWebhookConfig, sepayPaymentCode } from "@/lib/sepay";
import { buildVietQr, readFallbackBank } from "@/lib/vietqr";
import { pushOrder } from "@/lib/warehouse";
import { validateWarehouseVoucher } from "@/lib/warehouse-vouchers";

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
  /** mã giảm giá voucher khách áp dụng */
  voucherCode?: string;
};

const bad = (error: string, status = 400, extra: Record<string, unknown> = {}) =>
  Response.json({ error, ...extra }, { status });

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

  /*
   * Áo in là hàng làm riêng — không bán lại được cho ai nếu khách từ chối nhận.
   * Trang thanh toán đã giấu lựa chọn trả-khi-nhận-hàng khi giỏ có mẫu in, chỗ
   * này là hàng rào thật: một request tự soạn cũng không lách qua được.
   */
  if (codes.length > 0 && method !== PHUONG_THUC_CHO_DON_IN) {
    return bad(
      `Đơn có áo in theo yêu cầu chỉ nhận ${TEN_PHUONG_THUC[PHUONG_THUC_CHO_DON_IN].toLowerCase()} trước. `
        + "Vui lòng chọn lại hình thức thanh toán.",
    );
  }

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

  /*
   * Đơn in số lượng lớn KHÔNG chốt online. Studio đã chặn từng mẫu một, nhưng
   * khách hoàn toàn có thể ghép nhiều mẫu nhỏ thành một đơn đồng phục lớn —
   * ngưỡng phải tính trên cả đơn thì mới đúng thứ shop cần báo giá tay.
   */
  const printQty = prints.reduce((sum, print) => sum + print.qty, 0);
  if (isBulkPrint(printQty)) {
    return bad(
      `Đơn in từ ${BULK_PRINT_FROM} áo trở lên shop báo giá trực tiếp (đơn của bạn ${printQty} áo). `
        + `Vui lòng nhắn Zalo hoặc gọi ${CONTACT.phoneDisplay} kèm mã mẫu ${codes.join(", ")} `
        + "để shop chốt giá và lịch giao.",
      422,
    );
  }

  const priced = priceCart(
    await getCatalogue(),
    body.lines ?? [],
    sales,
    method,
    prints,
  );
  if (!priced.ok) return bad(priced.error);
  let cart = priced.cart;

  if (body.voucherCode?.trim()) {
    const voucher = await validateWarehouseVoucher(body.voucherCode, cart.subtotal, cart.shipping);
    if (!voucher.ok) return bad(voucher.error, 422);
    cart = applyVoucherQuote(cart, voucher.quote);
  }

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

  // Chỉ cất phiên thanh toán nội bộ trước khi hiện QR. Đơn chuyển khoản thật và
  // hàng đợi duyệt thiết kế chỉ được tạo sau webhook SePay báo PAID.
  const { ref, orderCode } = await reserveOrder();
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
  } else {
    const sepay = readSepayWebhookConfig();
    if (!sepay) {
      return bad(
        "SePay chưa được cấu hình. Vui lòng đặt SEPAY_WEBHOOK_API_KEY và SEPAY_PAYMENT_PREFIX.",
        503,
      );
    }

    let bank;
    try {
      bank = await getSepayBankAccount();
    } catch (error) {
      console.error("[checkout] không lấy được tài khoản SePay", error);
      bank = readFallbackBank();
      if (!bank) {
        return bad(
          error instanceof Error
            ? `${error.message} Cũng chưa có tài khoản ngân hàng dự phòng.`
            : "Không lấy được tài khoản SePay và chưa có tài khoản ngân hàng dự phòng.",
          503,
        );
      }
      console.warn("[checkout] đang dùng tài khoản ngân hàng dự phòng do SePay API không khả dụng");
    }

    // SePay nhận diện chính mã này (tiền tố + 10 ký tự ref), nên không chèn
    // khoảng trắng hoặc rút gọn — khách nhập tay vẫn được đối soát tự động.
    const description = sepayPaymentCode(ref, sepay);

    payment = {
      provider: "sepay",
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
    refund,
  };

  // COD không có sự kiện PAID từ SePay. Đơn in luôn bị chặn COD ở trên, nên
  // nhánh này chỉ giữ nguyên cách bán hàng có sẵn khi khách chọn trả lúc nhận.
  if (method === "cod") {
    const warehouse = await pushOrder(customer, cart, method, refund);
    if (!warehouse.ok) return bad(warehouse.error, warehouse.outOfStock ? 409 : 502);
    order.warehouseOrderCode = warehouse.orderCode;
  }

  try {
    await saveOrder(order);
  } catch (error) {
    console.error("[checkout] không lưu được phiên thanh toán", error);
    return bad("Không lưu được phiên thanh toán. Vui lòng thử lại.", 500);
  }

  return Response.json({ ref, url: `/checkout/${ref}` }, { status: 201 });
}
