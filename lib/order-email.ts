/**
 * Thư xác nhận "đã nhận được tiền" gửi cho khách.
 *
 * Server only. Chỉ được gọi sau khi đơn đã thật sự sang trạng thái PAID — thư
 * này là lời khẳng định đã nhận tiền, gửi nhầm lúc chưa nhận là mất uy tín.
 *
 * Hai đường cùng có thể xác nhận một đơn: webhook của PayOS và vòng poll của
 * trang thanh toán. `sendOrderConfirmation` an toàn khi bị gọi nhiều lần —
 * quyền gửi được giành qua `claimConfirmationEmail`, ai giành trước thì gửi.
 */

import { formatAddress } from "./checkout";
import { CONTACT } from "./contact";
import { formatPrice } from "./data";
import { deliver, isEmailConfigured, type OutgoingEmail } from "./email";
import { claimConfirmationEmail, releaseConfirmationEmail, type Order } from "./orders";

/** Chặn dữ liệu khách nhập phá vỡ HTML của thư — tên và địa chỉ là do người lạ gõ vào */
const esc = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Giờ Việt Nam, không phụ thuộc múi giờ máy chủ.
 * Máy chủ đặt ở Singapore hay Mỹ thì khách vẫn đọc đúng giờ mình đã chuyển khoản.
 */
const TIME_ZONE = "Asia/Ho_Chi_Minh";

/**
 * Ghép tay giờ và ngày thay vì dùng `dateStyle`+`timeStyle`.
 *
 * `vi-VN` với hai tuỳ chọn đó trả về "lúc 10:42 17 tháng 8, 2026" — tự nó đã
 * kèm chữ "lúc", nên câu "Thanh toán lúc …" đọc ra thành "lúc lúc". Ghép tay
 * thì mỗi nơi tự quyết định có cần chữ "lúc" hay không.
 */
const formatMoment = (ms: number) => {
  const at = new Date(ms);
  const time = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(at);
  const date = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(at);
  return `${time} ngày ${date}`;
};

const BRAND = {
  ink: "#1c1714",
  cream: "#f5efe6",
  creamDark: "#eae1d3",
  surface: "#fbf8f2",
  gold: "#a8804b",
  muted: "#7a726b",
  line: "#ded5c7",
};

// ── bản chữ thuần ────────────────────────────────────────────────────

function buildText(order: Order): string {
  const { customer, cart, payment } = order;
  const laCod = order.paymentMethod === "cod";
  const items = cart.lines.map(
    (line) =>
      `- ${line.name} (${line.color} / ${line.size}) x${line.qty} — ${formatPrice(line.total)}`,
  );

  return [
    `Cảm ơn bạn đã đặt hàng tại The Basic Concept!`,
    ``,
    `Chúng tôi đã nhận được thanh toán cho đơn ${order.ref}.`,
    order.paidAt ? `Thời điểm thanh toán: ${formatMoment(order.paidAt)}` : "",
    ``,
    `SẢN PHẨM`,
    ...items,
    ``,
    `Tạm tính: ${formatPrice(cart.subtotal)}`,
    `Phí giao hàng: ${cart.shipping === 0 ? "Miễn phí" : formatPrice(cart.shipping)}`,
    `Tổng cộng: ${formatPrice(cart.total)}`,
    ``,
    `NGƯỜI NHẬN`,
    `${customer.fullName} — ${customer.phone}`,
    customer.email,
    formatAddress(customer),
    customer.note ? `Ghi chú: ${customer.note}` : "",
    ``,
    `THANH TOÁN`,
    laCod
      ? `Thanh toán khi nhận hàng — trả ${formatPrice(cart.total)} cho người giao hàng.`
      : `Chuyển khoản ngân hàng${payment.bankName ? ` (${payment.bankName})` : ""}`,
    order.transactionRef ? `Mã giao dịch: ${order.transactionRef}` : "",
    ``,
    `Chúng tôi sẽ đóng gói và bàn giao cho đơn vị vận chuyển trong thời gian sớm nhất.`,
    ``,
    `LIÊN HỆ`,
    `Điện thoại / Zalo: ${CONTACT.phoneDisplay}`,
    `Zalo: ${CONTACT.zaloUrl}`,
    `Facebook: ${CONTACT.facebookUrl}`,
    ``,
    `The Basic Concept — Đơn giản. Hằng ngày. Cho tất cả.`,
  ]
    .filter((row) => row !== "")
    .join("\n");
}

// ── bản HTML ─────────────────────────────────────────────────────────

/**
 * Bảng lồng bảng và style nội tuyến, không dùng flex/grid.
 * Outlook vẫn dựng HTML bằng engine của Word — mọi bố cục hiện đại đều vỡ ở đó.
 */
function buildHtml(order: Order): string {
  const { customer, cart, payment } = order;
  const laCod = order.paymentMethod === "cod";

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:4px 0;color:${BRAND.muted};font-size:14px;white-space:nowrap;">${esc(label)}</td>
      <td style="padding:4px 0 4px 16px;color:${BRAND.ink};font-size:14px;text-align:right;">${esc(value)}</td>
    </tr>`;

  const items = cart.lines
    .map(
      (line) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid ${BRAND.line};">
        <div style="color:${BRAND.ink};font-size:15px;font-weight:600;">${esc(line.name)}</div>
        <div style="color:${BRAND.muted};font-size:13px;padding-top:3px;">
          ${esc(line.color)} · ${esc(line.size)} · SL ${line.qty}
        </div>
      </td>
      <td style="padding:14px 0;border-bottom:1px solid ${BRAND.line};text-align:right;color:${BRAND.ink};font-size:15px;font-weight:600;white-space:nowrap;">
        ${esc(formatPrice(line.total))}
      </td>
    </tr>`,
    )
    .join("");

  const totals = `
    ${row("Tạm tính", formatPrice(cart.subtotal))}
    ${row("Phí giao hàng", cart.shipping === 0 ? "Miễn phí" : formatPrice(cart.shipping))}
    <tr>
      <td style="padding:12px 0 0;border-top:1px solid ${BRAND.line};color:${BRAND.ink};font-size:17px;font-weight:700;">Tổng cộng</td>
      <td style="padding:12px 0 0;border-top:1px solid ${BRAND.line};color:${BRAND.ink};font-size:17px;font-weight:700;text-align:right;white-space:nowrap;">${esc(formatPrice(cart.total))}</td>
    </tr>`;

  const block = (title: string, body: string) => `
    <tr><td style="padding:28px 0 0;">
      <div style="color:${BRAND.gold};font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding-bottom:10px;">${esc(title)}</div>
      ${body}
    </td></tr>`;

  const addressBlock = `
    <div style="color:${BRAND.ink};font-size:15px;line-height:1.65;">
      <strong>${esc(customer.fullName)}</strong><br>
      ${esc(customer.phone)}<br>
      ${esc(customer.email)}<br>
      ${esc(formatAddress(customer))}
      ${customer.note ? `<br><span style="color:${BRAND.muted};">Ghi chú: ${esc(customer.note)}</span>` : ""}
    </div>`;

  const paymentBlock = `
    <div style="color:${BRAND.ink};font-size:15px;line-height:1.65;">
      ${
        laCod
          ? `Thanh toán khi nhận hàng — trả ${esc(formatPrice(cart.total))} cho người giao hàng.<br>`
          : `Chuyển khoản ngân hàng${payment.bankName ? ` · ${esc(payment.bankName)}` : ""}<br>`
      }
      ${order.paidAt ? `Thanh toán lúc ${esc(formatMoment(order.paidAt))}<br>` : ""}
      ${order.transactionRef ? `<span style="color:${BRAND.muted};">Mã giao dịch: ${esc(order.transactionRef)}</span>` : ""}
    </div>`;

  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Xác nhận đơn hàng ${esc(order.ref)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.cream};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Đã nhận thanh toán cho đơn ${esc(order.ref)} — ${esc(formatPrice(cart.total))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:32px 16px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.surface};border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

    <tr><td style="background:${BRAND.ink};padding:32px 32px 28px;text-align:center;">
      <div style="color:${BRAND.gold};font-size:26px;font-weight:700;letter-spacing:.12em;">TBC</div>
      <div style="color:${BRAND.cream};font-size:11px;letter-spacing:.28em;text-transform:uppercase;padding-top:8px;">The Basic Concept</div>
    </td></tr>

    <tr><td style="padding:32px 32px 0;">
      <h1 style="margin:0;color:${BRAND.ink};font-size:24px;line-height:1.25;">Cảm ơn bạn đã đặt hàng!</h1>
      <p style="margin:12px 0 0;color:${BRAND.muted};font-size:15px;line-height:1.65;">
        Chúng tôi đã nhận được thanh toán cho đơn <strong style="color:${BRAND.ink};">${esc(order.ref)}</strong>.
        Đơn của bạn đang được chuẩn bị và sẽ sớm bàn giao cho đơn vị vận chuyển.
      </p>
    </td></tr>

    <tr><td style="padding:24px 32px 0;">
      <div style="background:${BRAND.creamDark};border-radius:12px;padding:14px 18px;color:${BRAND.ink};font-size:14px;">
        Mã đơn hàng: <strong>${esc(order.ref)}</strong>
      </div>
    </td></tr>

    <tr><td style="padding:0 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${block("Sản phẩm", `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>`)}
        <tr><td style="padding:18px 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${totals}</table>
        </td></tr>
        ${block("Người nhận", addressBlock)}
        ${block("Thanh toán", paymentBlock)}
      </table>
    </td></tr>

    <tr><td style="padding:32px 32px 0;">
      <div style="border-top:1px solid ${BRAND.line};padding-top:24px;">
        <div style="color:${BRAND.gold};font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding-bottom:10px;">Cần hỗ trợ?</div>
        <p style="margin:0;color:${BRAND.muted};font-size:15px;line-height:1.7;">
          Có bất kỳ thắc mắc nào về đơn hàng, bạn cứ nhắn cho chúng tôi:<br>
          Điện thoại / Zalo:
          <a href="${CONTACT.phoneHref}" style="color:${BRAND.ink};font-weight:600;text-decoration:none;">${esc(CONTACT.phoneDisplay)}</a><br>
          Zalo: <a href="${CONTACT.zaloUrl}" style="color:${BRAND.ink};text-decoration:underline;">zalo.me</a>
          &nbsp;·&nbsp;
          Facebook: <a href="${CONTACT.facebookUrl}" style="color:${BRAND.ink};text-decoration:underline;">Fanpage</a>
        </p>
      </div>
    </td></tr>

    <tr><td style="padding:28px 32px 32px;text-align:center;">
      <p style="margin:0;color:${BRAND.muted};font-size:12px;line-height:1.7;">
        The Basic Concept — Đơn giản. Hằng ngày. Cho tất cả.<br>
        Thư này được gửi tự động tới ${esc(customer.email)} vì bạn vừa đặt hàng tại cửa hàng của chúng tôi.
      </p>
    </td></tr>

  </table>
</td></tr></table>
</body></html>`;
}

// ── dựng & gửi ───────────────────────────────────────────────────────

/**
 * Dựng nội dung thư từ một đơn hàng, không gửi đi đâu cả.
 *
 * Tách khỏi `sendOrderConfirmation` để kiểm tra được mẫu thư mà không phải
 * thật sự gửi mail cho ai — và để sau này muốn làm trang xem trước thì có sẵn.
 */
export function renderOrderConfirmation(order: Order): OutgoingEmail {
  return {
    to: order.customer.email,
    subject: `Đã nhận thanh toán — đơn ${order.ref} | The Basic Concept`,
    html: buildHtml(order),
    text: buildText(order),
  };
}

/**
 * Gửi thư xác nhận nếu đơn này chưa ai gửi. Gọi bao nhiêu lần cũng an toàn.
 *
 * Không bao giờ ném lỗi ra ngoài: hàm này chạy phía sau một webhook thanh
 * toán, và một lá thư không gửi được thì cũng không được phép làm hỏng việc
 * ghi nhận rằng khách đã trả tiền.
 */
export async function sendOrderConfirmation(order: Order): Promise<void> {
  if (order.status !== "PAID") return;

  if (!order.customer.email) {
    // đơn cũ, tạo từ thời email còn là tuỳ chọn
    console.warn(`[email] đơn ${order.ref} không có email, bỏ qua thư xác nhận`);
    return;
  }

  if (!isEmailConfigured()) {
    console.warn(
      `[email] chưa cấu hình SMTP_USER / SMTP_PASSWORD — đơn ${order.ref} không có thư xác nhận`,
    );
    return;
  }

  // Giành quyền TRƯỚC khi gửi. Giành sau thì hai tiến trình cùng gửi xong mới
  // phát hiện ra nhau, lúc đó khách đã nhận hai lá thư rồi.
  const claimed = await claimConfirmationEmail(order.ref);
  if (!claimed) return;

  try {
    await deliver(renderOrderConfirmation(claimed));
    console.log(`[email] đã gửi xác nhận đơn ${claimed.ref} tới ${claimed.customer.email}`);
  } catch (error) {
    // Mở lại cờ để lần xác nhận sau còn thử lại — vòng poll của trang thanh
    // toán sẽ chạy qua đây lần nữa sau vài giây.
    await releaseConfirmationEmail(claimed.ref);
    console.error(`[email] gửi xác nhận đơn ${claimed.ref} thất bại`, error);
  }
}
