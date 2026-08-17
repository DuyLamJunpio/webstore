/**
 * Order storage.
 *
 * The shop has no database, so orders live in a JSON file under `.data/`. That
 * is enough for one server writing to one disk — `next dev`, a VPS, a container
 * with a volume — and it keeps the checkout flow honest end to end: the payment
 * page reads a real stored order rather than trusting query parameters.
 *
 * It is deliberately the only module that knows *where* orders live. Swapping in
 * Postgres or Prisma means reimplementing the five functions at the bottom and
 * touching nothing else.
 *
 * Caveats worth knowing before this goes anywhere serious: a serverless
 * deployment gets a fresh, empty filesystem per instance, and two processes
 * writing at once would clobber each other. Both are database problems.
 */

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CustomerInfo, PricedCart } from "./checkout";
import type { PaymentStatus } from "./payos";

export type OrderPayment = {
  /** "payos" once the merchant keys are in place; "fallback" is a local VietQR */
  provider: "payos" | "fallback";
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
   * Mã đơn bên trang quản trị (Laravel), ví dụ "DH2608171ABC".
   *
   * Trang quản trị mới là nơi giữ tồn kho và danh sách đơn thật; file JSON này
   * chỉ phục vụ trang thanh toán. Giữ mã lại để báo "đã nhận tiền" đúng đơn.
   */
  warehouseOrderCode?: string;
};

type Store = { v: 1; orders: Record<string, Order> };

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "orders.json");
/** old orders are dropped on write so the file cannot grow forever */
const KEEP_MS = 60 * 24 * 60 * 60 * 1000;

/** every write goes through this chain, so two requests cannot interleave a read-modify-write */
let queue: Promise<unknown> = Promise.resolve();

/**
 * Luôn đọc lại từ đĩa — cố ý không giữ bản sao trong bộ nhớ.
 *
 * Bản sao đó từng làm hỏng đúng hai thứ, vì Next đóng gói route handler và
 * server component thành hai bundle khác nhau: mỗi bên giữ một bản sao riêng
 * và không bên nào biết bên kia vừa ghi gì.
 *
 *   • `/api/checkout` tạo đơn mới → bản sao của trang `/checkout/[ref]` vẫn là
 *     ảnh chụp cũ, không có đơn đó → khách nhận 404 ngay sau khi đặt hàng.
 *   • tệ hơn: `transaction()` ghi nguyên bản sao cũ đó xuống đĩa, xoá sạch
 *     những đơn mà bên kia vừa lưu.
 *
 * Tệp này chỉ vài KB nên đọc lại mỗi lần là không đáng kể — và khi nào nó đủ
 * lớn để thành vấn đề thì câu trả lời là cơ sở dữ liệu, không phải bộ nhớ đệm.
 */
async function read(): Promise<Store> {
  try {
    const parsed = JSON.parse(await readFile(FILE, "utf8")) as Store;
    return parsed?.v === 1 && parsed.orders ? parsed : { v: 1, orders: {} };
  } catch {
    // no file yet, or someone hand-edited it into invalid JSON
    return { v: 1, orders: {} };
  }
}

async function write(store: Store): Promise<void> {
  const cutoff = Date.now() - KEEP_MS;
  store.orders = Object.fromEntries(
    Object.entries(store.orders).filter(([, order]) => order.createdAt > cutoff),
  );

  await mkdir(DIR, { recursive: true });
  // write-then-rename: a crash mid-write leaves the previous file intact
  const temp = `${FILE}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(store, null, 2), "utf8");
  await rename(temp, FILE);
}

/** serialises a read-modify-write against the store */
function transaction<T>(work: (store: Store) => Promise<T> | T): Promise<T> {
  const next = queue.then(async () => {
    const store = await read();
    const result = await work(store);
    await write(store);
    return result;
  });
  // keep the chain alive even when this link rejects
  queue = next.catch(() => undefined);
  return next;
}

// ── ids ──────────────────────────────────────────────────────────────

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 — these get read aloud

/** short, unambiguous, unguessable: 12 chars of the reduced alphabet ≈ 60 bits */
function newRef(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

/**
 * PayOS wants a positive integer, unique for the lifetime of the merchant
 * account. Milliseconds since the epoch is unique per shop and stays well
 * inside the 2^53 ceiling; the loop only matters if two orders land on the
 * same millisecond.
 */
function newOrderCode(store: Store): number {
  const taken = new Set(Object.values(store.orders).map((order) => order.orderCode));
  let code = Date.now();
  while (taken.has(code)) code += 1;
  return code;
}

// ── the five functions a database would have to replace ──────────────

/** reserves ref + orderCode before the payment link exists, so PayOS can be told both */
export function reserveOrder(): Promise<{ ref: string; orderCode: number }> {
  return transaction((store) => {
    let ref = newRef();
    while (store.orders[ref]) ref = newRef();
    return { ref, orderCode: newOrderCode(store) };
  });
}

export function saveOrder(order: Order): Promise<Order> {
  return transaction((store) => {
    store.orders[order.ref] = order;
    return order;
  });
}

export async function getOrder(ref: string): Promise<Order | null> {
  const store = await read();
  return store.orders[ref] ?? null;
}

export async function getOrderByCode(orderCode: number): Promise<Order | null> {
  const store = await read();
  return Object.values(store.orders).find((order) => order.orderCode === orderCode) ?? null;
}

export function updateOrder(ref: string, patch: Partial<Order>): Promise<Order | null> {
  return transaction((store) => {
    const current = store.orders[ref];
    if (!current) return null;
    const next = { ...current, ...patch };
    store.orders[ref] = next;
    return next;
  });
}

/**
 * Giành quyền gửi thư xác nhận cho một đơn.
 *
 * Trả về đơn hàng khi giành được, `null` khi đã có người khác giành trước.
 * Việc kiểm tra và đánh dấu nằm gọn trong MỘT `transaction`, nên webhook và
 * vòng poll chạy sát nhau vẫn chỉ một bên thắng — tách thành đọc rồi ghi là mở
 * ra đúng khe hở để cả hai cùng thấy "chưa gửi" và cùng gửi.
 */
export function claimConfirmationEmail(ref: string): Promise<Order | null> {
  return transaction((store) => {
    const current = store.orders[ref];
    if (!current || current.confirmationEmailSentAt) return null;
    const next = { ...current, confirmationEmailSentAt: Date.now() };
    store.orders[ref] = next;
    return next;
  });
}

/** trả lại quyền khi gửi hỏng, để lần xác nhận sau còn thử lại được */
export function releaseConfirmationEmail(ref: string): Promise<Order | null> {
  return transaction((store) => {
    const current = store.orders[ref];
    if (!current) return null;
    const next = { ...current };
    delete next.confirmationEmailSentAt;
    store.orders[ref] = next;
    return next;
  });
}
