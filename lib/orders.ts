/**
 * Order storage.
 *
 * Đơn của trang thanh toán nằm bên trang quản trị, cạnh đơn hàng thật. Trước
 * đây chúng nằm trong một tệp JSON trên đĩa máy chủ này, và trên Vercel thì đó
 * là một cái bẫy: thư mục duy nhất ghi được là thư mục tạm của máy ảo, mà máy ảo
 * bị thay sau vài phút. Đơn vẫn vào sổ bên kho, mã QR vẫn hiện — rồi giữa lúc
 * khách còn đang ở trong app ngân hàng, trang đơn hàng thành 404.
 *
 * Trang quản trị là chỗ duy nhất trong hệ thống này có cơ sở dữ liệu thật, nên
 * nó giữ luôn: một bảng `storefront_orders` với cả đơn trong một cột JSON.
 *
 * Đây vẫn là module duy nhất biết đơn nằm ở ĐÂU. Đổi chỗ lưu lần nữa là viết lại
 * mấy hàm ở cuối tệp và không sửa gì thêm.
 *
 * Điều phải biết trước khi đọc tiếp: mỗi hàm ở đây là một lần gọi mạng, không
 * còn là một lần đọc đĩa. Chúng ném lỗi khi trang quản trị không trả lời, và
 * `null` chỉ có một nghĩa duy nhất — đơn không tồn tại.
 */

import type { CustomerInfo, PricedCart } from "./checkout";
import type { PaymentStatus } from "./payos";
import type { PaymentMethodKey } from "./sales";
import { warehouseFetch } from "./warehouse";

export type OrderPayment = {
  /**
   * "payos" once the merchant keys are in place; "fallback" is a local VietQR.
   * "cod" là đơn trả khi nhận hàng — không có mã QR nào để hiện.
   */
  provider: "payos" | "fallback" | "cod";
  bin: string;
  bankName?: string;
  accountNumber: string;
  accountName: string;
  /** integer VND — the figure on the QR */
  amount: number;
  /** the transfer memo the bank app will prefill */
  description: string;
  /** raw EMVCo payload; render it as a QR, never show the string */
  qrCode: string;
  checkoutUrl?: string;
  paymentLinkId?: string;
};

export type Order = {
  /** unguessable id used in the URL, so order pages cannot be enumerated */
  ref: string;
  /** the integer PayOS keys the payment on */
  orderCode: number;
  createdAt: number;
  expiresAt: number;
  status: PaymentStatus;
  paidAt?: number;
  /**
   * VND actually received. Only interesting when it falls short of
   * `payment.amount` — PayOS reports that as UNDERPAID, and the shopper needs
   * to be told how much is still missing.
   */
  amountPaid?: number;
  /** bank reference of the transaction that settled it */
  transactionRef?: string;
  /**
   * Lúc thư xác nhận được nhận gửi, tính bằng mili giây.
   *
   * Có mặt = đã có người nhận việc gửi, đừng gửi nữa. Hai đường đều có thể xác
   * nhận một đơn đã trả tiền — webhook của PayOS và vòng poll của trang thanh
   * toán — nên thiếu cờ này là khách nhận hai, ba lá thư giống hệt nhau.
   */
  confirmationEmailSentAt?: number;
  customer: CustomerInfo;
  cart: PricedCart;
  payment: OrderPayment;
  /**
   * Khách chọn trả kiểu gì. Thiếu = chuyển khoản: đơn đặt trước khi web có lựa
   * chọn này đều là chuyển khoản, và đọc chúng không được phép hỏng.
   */
  paymentMethod?: PaymentMethodKey;
  /**
   * Mã đơn bên trang quản trị (Laravel), ví dụ "DH2608171ABC".
   *
   * Trang quản trị mới là nơi giữ tồn kho và danh sách đơn thật. Giữ mã lại để
   * báo "đã nhận tiền" đúng đơn.
   */
  warehouseOrderCode?: string;
};

// ── ids ──────────────────────────────────────────────────────────────

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 — these get read aloud

/** short, unambiguous, unguessable: 12 chars of the reduced alphabet ≈ 60 bits */
function newRef(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

/** mã cuối đã phát ra từ tiến trình này, để hai đơn sát nhau không trùng mã */
let lastOrderCode = 0;

/**
 * PayOS wants a positive integer, unique for the lifetime of the merchant
 * account. Milliseconds since the epoch is unique per shop and stays well
 * inside the 2^53 ceiling.
 *
 * Cột `order_code` bên kho là UNIQUE, nên trùng mã bị chặn thẳng chứ không âm
 * thầm khớp sai giao dịch. Bộ đếm dưới đây lo phần hay xảy ra: hai đơn rơi vào
 * cùng một mili giây trên cùng một máy chủ.
 */
function newOrderCode(): number {
  const now = Date.now();
  lastOrderCode = now > lastOrderCode ? now : lastOrderCode + 1;
  return lastOrderCode;
}

// ── the five functions a database would have to replace ──────────────

const ROOT = "/api/storefront/orders";

const at = (ref: string) => `${ROOT}/${encodeURIComponent(ref)}`;

/**
 * Đọc một đơn.
 *
 * 404 là "không có đơn nào như thế" và trả về `null`. Mọi mã lỗi khác đều ném ra
 * — một sự cố bên kho KHÔNG được phép biến thành "không tìm thấy đơn hàng" trên
 * trang khách đang chờ tiền về, vì hai chuyện đó cần hai câu trả lời khác nhau.
 */
async function readOrder(url: string): Promise<Order | null> {
  const response = await warehouseFetch(url);

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Trang quản trị trả về HTTP ${response.status} khi đọc đơn hàng.`);
  }

  return (await response.json()) as Order;
}

/**
 * reserves ref + orderCode before the payment link exists, so PayOS can be told both
 *
 * Không gọi mạng: mã sinh ngay tại đây, và bảng bên kho tự chặn trùng lúc lưu.
 * Thêm một chặng mạng vào đây chỉ làm khách chờ thêm ngay trước khi thấy mã QR.
 */
export async function reserveOrder(): Promise<{ ref: string; orderCode: number }> {
  return { ref: newRef(), orderCode: newOrderCode() };
}

export async function saveOrder(order: Order): Promise<Order> {
  const response = await warehouseFetch(ROOT, {
    method: "POST",
    body: JSON.stringify({ ref: order.ref, order_code: order.orderCode, payload: order }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(
      data?.error ?? `Trang quản trị trả về HTTP ${response.status} khi lưu đơn hàng.`,
    );
  }

  return order;
}

export function getOrder(ref: string): Promise<Order | null> {
  return readOrder(at(ref));
}

export function getOrderByCode(orderCode: number): Promise<Order | null> {
  return readOrder(`${ROOT}/by-code/${orderCode}`);
}

/**
 * Ghi một phần thay đổi vào đơn.
 *
 * Bên kho hoà `patch` vào đơn trong một transaction có khoá dòng, nên webhook
 * PayOS và vòng poll chạy sát nhau vẫn không xoá mất phần của nhau.
 */
export async function updateOrder(ref: string, patch: Partial<Order>): Promise<Order | null> {
  const response = await warehouseFetch(at(ref), {
    method: "PATCH",
    body: JSON.stringify({ patch }),
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Trang quản trị trả về HTTP ${response.status} khi cập nhật đơn hàng.`);
  }

  return (await response.json()) as Order;
}

/**
 * Giành quyền gửi thư xác nhận cho một đơn.
 *
 * Trả về đơn hàng khi giành được, `null` khi đã có người khác giành trước. Việc
 * kiểm tra và đánh dấu nằm gọn trong một transaction bên kho (409 = đã có người
 * giành trước), nên webhook và vòng poll chạy sát nhau vẫn chỉ một bên thắng.
 */
export async function claimConfirmationEmail(ref: string): Promise<Order | null> {
  const response = await warehouseFetch(`${at(ref)}/email-claim`, { method: "POST" });

  if (response.status === 404 || response.status === 409) return null;
  if (!response.ok) {
    throw new Error(`Trang quản trị trả về HTTP ${response.status} khi nhận gửi thư xác nhận.`);
  }

  return (await response.json()) as Order;
}

/** trả lại quyền khi gửi hỏng, để lần xác nhận sau còn thử lại được */
export async function releaseConfirmationEmail(ref: string): Promise<Order | null> {
  const response = await warehouseFetch(`${at(ref)}/email-claim`, { method: "DELETE" });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Trang quản trị trả về HTTP ${response.status} khi trả lại việc gửi thư.`);
  }

  return (await response.json()) as Order;
}
