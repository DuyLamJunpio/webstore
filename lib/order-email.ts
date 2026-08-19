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
import { BRAND, block, esc, formatMoment, renderShell, row } from "./email-layout";
import { claimConfirmationEmail, releaseConfirmationEmail, type Order } from "./orders";

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

  return renderShell({
    title: `Xác nhận đơn hàng ${order.ref}`,
    preheader: `Đã nhận thanh toán cho đơn ${order.ref} — ${formatPrice(cart.total)}`,
    heading: "Cảm ơn bạn đã đặt hàng!",
    lead: `Chúng tôi đã nhận được thanh toán cho đơn <strong style="color:${BRAND.ink};">${esc(order.ref)}</strong>.
        Đơn của bạn đang được chuẩn bị và sẽ sớm bàn giao cho đơn vị vận chuyển.`,
    badge: `Mã đơn hàng: <strong>${esc(order.ref)}</strong>`,
    sections: `${block("Sản phẩm", `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>`)}
        <tr><td style="padding:18px 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${totals}</table>
        </td></tr>
        ${block("Người nhận", addressBlock)}
        ${block("Thanh toán", paymentBlock)}`,
    recipient: customer.email,
    reason: "vì bạn vừa đặt hàng tại cửa hàng của chúng tôi.",
  });
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

  /*
   * Giành quyền TRƯỚC khi gửi. Giành sau thì hai tiến trình cùng gửi xong mới
   * phát hiện ra nhau, lúc đó khách đã nhận hai lá thư rồi.
   *
   * Cờ này nằm bên kho, nên giành quyền là một lần gọi mạng và có thể hỏng. Hàm
   * này được gọi ngay trong lúc dựng trang đơn hàng, nên một lá thư gửi trễ
   * KHÔNG được phép biến thành trang lỗi trước mặt khách: bỏ qua lần này, vòng
   * poll của trang thanh toán sẽ chạy lại qua đây sau vài giây.
   */
  let claimed: Order | null;
  try {
    claimed = await claimConfirmationEmail(order.ref);
  } catch (error) {
    console.error(`[email] không giành được quyền gửi thư cho đơn ${order.ref}`, error);
    return;
  }
  if (!claimed) return;

  try {
    await deliver(renderOrderConfirmation(claimed));
    console.log(`[email] đã gửi xác nhận đơn ${claimed.ref} tới ${claimed.customer.email}`);
  } catch (error) {
    console.error(`[email] gửi xác nhận đơn ${claimed.ref} thất bại`, error);

    // Mở lại cờ để lần xác nhận sau còn thử lại — vòng poll của trang thanh
    // toán sẽ chạy qua đây lần nữa sau vài giây.
    try {
      await releaseConfirmationEmail(claimed.ref);
    } catch (releaseError) {
      // Không mở lại được thì đơn này mất lá thư xác nhận, chứ không mất tiền.
      console.error(`[email] không mở lại được cờ gửi thư đơn ${claimed.ref}`, releaseError);
    }
  }
}
