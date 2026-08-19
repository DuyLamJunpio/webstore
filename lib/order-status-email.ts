/**
 * Thư báo đơn hàng vừa đổi trạng thái.
 *
 * Server only. Khác với thư "đã nhận thanh toán" ở `lib/order-email.ts`: thư đó
 * nói về tiền và chỉ gửi một lần duy nhất, thư này nói về hành trình của gói
 * hàng và gửi lại mỗi lần nhân viên bên kho chuyển đơn sang bước tiếp theo.
 *
 * Nguồn dữ liệu là trang quản trị, không phải chỗ lưu đơn của web bán hàng: kho
 * mới là nơi giữ đơn hàng thật, và nó cũng nhận cả những đơn không đi qua web
 * (nhân viên tự lập tại cửa hàng). Nhờ vậy khách của mọi đường đặt hàng đều nhận
 * được thư giống nhau.
 */

import { formatPrice } from "./data";
import { deliver, isEmailConfigured, type OutgoingEmail } from "./email";
import { BRAND, block, esc, formatMoment, renderShell, row } from "./email-layout";

/** Đúng bộ trạng thái đơn hàng của trang quản trị (Invoice::ORDER_STATUSES). */
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packing",
  "shipping",
  "completed",
  "cancelled",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const isOrderStatus = (value: unknown): value is OrderStatus =>
  typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);

export type StatusMailLine = {
  name: string;
  /** màu và cỡ, ví dụ "Đen / M" — kho gọi đây là nhãn biến thể */
  variant: string;
  quantity: number;
  /** thành tiền của dòng, đồng */
  total: number;
};

export type StatusMail = {
  /** mã đơn bên kho, ví dụ "DH2608171ABC" — đây là mã khách đọc cho nhân viên */
  orderCode: string;
  status: OrderStatus;
  /** trạng thái trước đó; null khi không rõ */
  previousStatus: OrderStatus | null;
  /** lúc đổi trạng thái, mili giây epoch */
  changedAt: number;
  /** đã nhận được tiền của đơn này chưa — đổi hẳn lời thư khi đơn bị huỷ */
  paid: boolean;
  paymentMethod: "cod" | "banking";
  customer: { name: string; email: string; phone: string; address: string };
  note: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  lines: StatusMailLine[];
};

/** Nhãn tiếng Việt của trạng thái, giống nguyên bên trang quản trị. */
const LABEL: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  packing: "Đang đóng gói",
  shipping: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  returned: "Hoàn hàng",
};

export const statusLabel = (status: OrderStatus) => LABEL[status];

/**
 * Lời thư cho từng trạng thái.
 *
 * `lead` trả về HTML nên mọi thứ khách tự gõ vào phải qua `esc()` — ở đây chỉ có
 * mã đơn, số điện thoại và số tiền, nhưng vẫn escape cho chắc.
 */
const COPY: Record<
  OrderStatus,
  { subject: string; heading: string; lead: (mail: StatusMail) => string }
> = {
  pending: {
    subject: "Đã nhận đơn hàng",
    heading: "Đã nhận đơn hàng",
    lead: (mail) =>
      `Shop đã nhận đơn <strong style="color:${BRAND.ink};">${esc(mail.orderCode)}</strong> và sẽ
        kiểm tra rồi xác nhận với bạn trong thời gian sớm nhất.`,
  },

  confirmed: {
    subject: "Đơn hàng đã được xác nhận",
    heading: "Đơn hàng đã được xác nhận",
    lead: (mail) =>
      `Shop đã kiểm hàng và xác nhận đơn <strong style="color:${BRAND.ink};">${esc(mail.orderCode)}</strong>.
        Chúng tôi bắt đầu chuẩn bị hàng cho bạn ngay bây giờ.`,
  },

  packing: {
    subject: "Đơn hàng đang được đóng gói",
    heading: "Đơn hàng đang được đóng gói",
    lead: (mail) =>
      `Đơn <strong style="color:${BRAND.ink};">${esc(mail.orderCode)}</strong> đang được soạn và đóng gói.
        Khi hàng rời kho, bạn sẽ nhận được một thư nữa từ chúng tôi.`,
  },

  shipping: {
    subject: "Đơn hàng đang trên đường tới bạn",
    heading: "Đơn hàng đang trên đường",
    lead: (mail) =>
      `Đơn <strong style="color:${BRAND.ink};">${esc(mail.orderCode)}</strong> đã rời kho và đang trên
        đường tới bạn.${
          mail.paymentMethod === "cod" && !mail.paid
            ? ` Bạn chuẩn bị sẵn <strong style="color:${BRAND.ink};">${esc(formatPrice(mail.total))}</strong>
        tiền mặt để trả cho người giao hàng nhé.`
            : ""
        } Người giao hàng sẽ gọi số ${esc(mail.customer.phone)} trước khi tới.`,
  },

  completed: {
    subject: "Đơn hàng đã hoàn tất",
    heading: "Đơn hàng đã hoàn tất",
    lead: (mail) =>
      `Đơn <strong style="color:${BRAND.ink};">${esc(mail.orderCode)}</strong> đã giao xong. Cảm ơn bạn
        đã tin chọn The Basic Concept — mong được gặp lại bạn.`,
  },

  cancelled: {
    subject: "Đơn hàng đã được huỷ",
    heading: "Đơn hàng đã được huỷ",
    lead: (mail) =>
      `Đơn <strong style="color:${BRAND.ink};">${esc(mail.orderCode)}</strong> đã được huỷ.${
        mail.paid
          ? ` Đơn này đã thanh toán, nên shop sẽ chủ động liên hệ để hoàn lại
        <strong style="color:${BRAND.ink};">${esc(formatPrice(mail.total))}</strong> cho bạn.`
          : " Bạn chưa bị trừ khoản nào cho đơn này."
      } Nếu đây không phải điều bạn muốn, nhắn cho shop kèm mã đơn là chúng tôi đặt lại giúp bạn.`,
  },

  returned: {
    subject: "Đơn hàng đã được hoàn về",
    heading: "Đơn hàng đã được hoàn về",
    lead: (mail) =>
      `Đơn <strong style="color:${BRAND.ink};">${esc(mail.orderCode)}</strong> đã được hoàn về shop.${
        mail.paid
          ? ` Shop sẽ liên hệ để hoàn lại
        <strong style="color:${BRAND.ink};">${esc(formatPrice(mail.total))}</strong> cho bạn.`
          : ""
      } Nếu có gì chưa ổn với sản phẩm, mong bạn nhắn lại để shop làm tốt hơn.`,
  },
};

// ── bản chữ thuần ────────────────────────────────────────────────────

/** Bỏ thẻ HTML để dùng lại đúng lời thư cho bản chữ thuần, không viết hai lần. */
const stripTags = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

function buildText(mail: StatusMail): string {
  const lines = mail.lines.map(
    (line) => `- ${line.name} (${line.variant}) x${line.quantity}: ${formatPrice(line.total)}`,
  );

  return [
    "THE BASIC CONCEPT",
    "",
    COPY[mail.status].heading.toUpperCase(),
    "",
    stripTags(COPY[mail.status].lead(mail)),
    "",
    `Mã đơn hàng: ${mail.orderCode}`,
    `Trạng thái: ${LABEL[mail.status]}${
      mail.previousStatus ? ` (trước đó: ${LABEL[mail.previousStatus]})` : ""
    }`,
    `Cập nhật lúc ${formatMoment(mail.changedAt)}`,
    "",
    "SẢN PHẨM",
    ...lines,
    "",
    `Tạm tính: ${formatPrice(mail.subtotal)}`,
    `Phí giao hàng: ${mail.shipping === 0 ? "Miễn phí" : formatPrice(mail.shipping)}`,
    `Tổng cộng: ${formatPrice(mail.total)}`,
    "",
    "NGƯỜI NHẬN",
    mail.customer.name,
    mail.customer.phone,
    mail.customer.address,
    ...(mail.note ? [`Ghi chú: ${mail.note}`] : []),
    "",
    `Cần hỗ trợ? Nhắn cho shop kèm mã đơn ${mail.orderCode}.`,
  ].join("\n");
}

// ── dựng & gửi ───────────────────────────────────────────────────────

/**
 * Dựng nội dung thư, không gửi đi đâu cả.
 *
 * Tách khỏi `sendOrderStatusMail` để xem được mẫu thư mà không phải gửi mail
 * thật cho ai.
 */
export function renderOrderStatusMail(mail: StatusMail): OutgoingEmail {
  const copy = COPY[mail.status];

  const items = mail.lines
    .map(
      (line) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid ${BRAND.line};">
        <div style="color:${BRAND.ink};font-size:15px;font-weight:600;">${esc(line.name)}</div>
        <div style="color:${BRAND.muted};font-size:13px;padding-top:3px;">
          ${esc(line.variant)} · SL ${line.quantity}
        </div>
      </td>
      <td style="padding:14px 0;border-bottom:1px solid ${BRAND.line};text-align:right;color:${BRAND.ink};font-size:15px;font-weight:600;white-space:nowrap;">
        ${esc(formatPrice(line.total))}
      </td>
    </tr>`,
    )
    .join("");

  const totals = `
    ${row("Tạm tính", formatPrice(mail.subtotal))}
    ${row("Phí giao hàng", mail.shipping === 0 ? "Miễn phí" : formatPrice(mail.shipping))}
    <tr>
      <td style="padding:12px 0 0;border-top:1px solid ${BRAND.line};color:${BRAND.ink};font-size:17px;font-weight:700;">Tổng cộng</td>
      <td style="padding:12px 0 0;border-top:1px solid ${BRAND.line};color:${BRAND.ink};font-size:17px;font-weight:700;text-align:right;white-space:nowrap;">${esc(formatPrice(mail.total))}</td>
    </tr>`;

  const addressBlock = `
    <div style="color:${BRAND.ink};font-size:15px;line-height:1.65;">
      <strong>${esc(mail.customer.name)}</strong><br>
      ${esc(mail.customer.phone)}<br>
      ${esc(mail.customer.address)}
      ${mail.note ? `<br><span style="color:${BRAND.muted};">Ghi chú: ${esc(mail.note)}</span>` : ""}
    </div>`;

  /* Chặng vừa đi qua, để khách thấy đơn đang ở đâu trong hành trình. */
  const journey = `
    <div style="color:${BRAND.ink};font-size:15px;line-height:1.65;">
      ${
        mail.previousStatus
          ? `${esc(LABEL[mail.previousStatus])} → <strong>${esc(LABEL[mail.status])}</strong><br>`
          : `<strong>${esc(LABEL[mail.status])}</strong><br>`
      }
      <span style="color:${BRAND.muted};">Cập nhật lúc ${esc(formatMoment(mail.changedAt))}</span>
    </div>`;

  return {
    to: mail.customer.email,
    subject: `${copy.subject} — đơn ${mail.orderCode} | The Basic Concept`,
    html: renderShell({
      title: `${copy.subject} ${mail.orderCode}`,
      preheader: `Đơn ${mail.orderCode}: ${LABEL[mail.status]}`,
      heading: copy.heading,
      lead: copy.lead(mail),
      badge: `Mã đơn hàng: <strong>${esc(mail.orderCode)}</strong>`,
      sections: `${block("Trạng thái", journey)}
        ${block("Sản phẩm", `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>`)}
        <tr><td style="padding:18px 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${totals}</table>
        </td></tr>
        ${block("Người nhận", addressBlock)}`,
      recipient: mail.customer.email,
      reason: "vì bạn có một đơn hàng tại cửa hàng của chúng tôi.",
    }),
    text: buildText(mail),
  };
}

/**
 * Gửi thư báo đổi trạng thái. Trả về true khi thư đã đi.
 *
 * Không bao giờ ném lỗi ra ngoài: hàm này chạy phía sau một thao tác của nhân
 * viên bên kho, và một lá thư không gửi được thì không được phép làm thao tác
 * đổi trạng thái trông như đã thất bại.
 *
 * Cũng cố ý KHÔNG chống gửi trùng như thư xác nhận thanh toán: mỗi lần đổi
 * trạng thái là một sự kiện riêng, kể cả khi đơn quay lại một trạng thái đã đi
 * qua. Kho chỉ gọi đúng một lần cho mỗi lần đổi.
 */
export async function sendOrderStatusMail(mail: StatusMail): Promise<boolean> {
  if (!mail.customer.email) {
    console.warn(`[email] đơn ${mail.orderCode} không có email, bỏ qua thư đổi trạng thái`);
    return false;
  }

  if (!isEmailConfigured()) {
    console.warn(
      `[email] chưa cấu hình SMTP_USER / SMTP_PASSWORD — đơn ${mail.orderCode} không có thư đổi trạng thái`,
    );
    return false;
  }

  try {
    await deliver(renderOrderStatusMail(mail));
    console.log(
      `[email] đã báo đơn ${mail.orderCode} sang "${LABEL[mail.status]}" tới ${mail.customer.email}`,
    );
    return true;
  } catch (error) {
    console.error(`[email] không gửi được thư đổi trạng thái đơn ${mail.orderCode}`, error);
    return false;
  }
}
