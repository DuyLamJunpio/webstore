/**
 * Thư báo khách kết quả duyệt thiết kế in.
 *
 * Đây là lá thư quan trọng nhất của module in. Mẫu bị từ chối nghĩa là khách vừa
 * trả tiền cho một thứ shop sẽ không làm — họ cần biết NGAY, biết VÌ SAO, và biết
 * tiền quay lại đường nào. Im lặng ở đúng chỗ này là khách phải tự gọi lên hỏi.
 *
 * Trang quản trị gọi vào đây qua `/api/print/review-mail`; nó không tự gửi thư vì
 * tài khoản SMTP và mẫu thư theo nhận diện shop đều nằm bên này.
 */

import { deliver } from "./email";
import { BRAND, block, esc, renderShell, row } from "./email-layout";
import { formatPrice } from "./data";

export type PrintReviewMail = {
  designCode: string;
  decision: "approved" | "rejected";
  note: string;
  customerName: string;
  customerEmail: string;
  orderCode: string;
  blankName: string;
  techniqueName: string;
  colorName: string;
  size: string;
  qty: number;
  totalPrice: number;
  paid: boolean;
  refundBankName: string;
  refundAccountNumber: string;
  refundAccountName: string;
};

export const isReviewDecision = (value: unknown): value is PrintReviewMail["decision"] =>
  value === "approved" || value === "rejected";

/**
 * Bốn số cuối là đủ để khách nhận ra tài khoản của mình mà thư không mang theo
 * cả số tài khoản — thư đi qua nhiều chặng và nằm lại trong hộp thư rất lâu.
 */
const maskAccount = (value: string) =>
  value.length <= 4 ? value : `${"•".repeat(Math.min(value.length - 4, 8))}${value.slice(-4)}`;

function refundBlock(mail: PrintReviewMail): string {
  if (!mail.paid) {
    return block(
      "Về khoản tiền",
      `<p style="margin:0;color:${BRAND.ink};font-size:14px;line-height:1.6;">
         Đơn này chưa ghi nhận thanh toán nên không có gì phải hoàn.
       </p>`,
    );
  }

  if (!mail.refundAccountNumber) {
    return block(
      "Hoàn tiền",
      `<p style="margin:0;color:${BRAND.ink};font-size:14px;line-height:1.6;">
         Shop sẽ hoàn lại <b>${esc(formatPrice(mail.totalPrice))}</b>. Bạn nhắn lại giúp shop
         số tài khoản nhận tiền nhé — đơn này chưa có thông tin đó.
       </p>`,
    );
  }

  return block(
    "Hoàn tiền",
    `<p style="margin:0 0 12px;color:${BRAND.ink};font-size:14px;line-height:1.6;">
       Shop sẽ hoàn lại <b>${esc(formatPrice(mail.totalPrice))}</b> vào tài khoản bạn đã để lại:
     </p>
     <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
       ${row("Ngân hàng", mail.refundBankName || "—")}
       ${row("Số tài khoản", maskAccount(mail.refundAccountNumber))}
       ${row("Chủ tài khoản", mail.refundAccountName || "—")}
     </table>`,
  );
}

export async function sendPrintReviewMail(mail: PrintReviewMail) {
  const approved = mail.decision === "approved";

  const heading = approved ? "Thiết kế đã được duyệt" : "Thiết kế chưa in được";

  const lead = approved
    ? `Chào ${esc(mail.customerName || "bạn")}, mẫu áo <b>${esc(mail.designCode)}</b> của bạn đã qua khâu
       kiểm file và đang được đưa vào xưởng.`
    : `Chào ${esc(mail.customerName || "bạn")}, shop đã xem kỹ mẫu áo <b>${esc(mail.designCode)}</b> nhưng
       chưa in được. Lý do cụ thể ở ngay bên dưới.`;

  const reason = mail.note
    ? block(
        approved ? "Ghi chú của shop" : "Vì sao chưa in được",
        `<p style="margin:0;color:${BRAND.ink};font-size:14px;line-height:1.6;white-space:pre-line;">${esc(mail.note)}</p>`,
      )
    : "";

  const details = block(
    "Mẫu áo",
    `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
       ${row("Phôi", mail.blankName || "—")}
       ${row("Màu / size", `${mail.colorName || "—"} · ${mail.size || "—"}`)}
       ${row("Kỹ thuật in", mail.techniqueName || "—")}
       ${row("Số lượng", `${mail.qty} áo`)}
       ${row("Thành tiền", formatPrice(mail.totalPrice))}
     </table>`,
  );

  const next = approved
    ? block(
        "Tiếp theo",
        `<p style="margin:0;color:${BRAND.ink};font-size:14px;line-height:1.6;">
           Shop sẽ báo lại khi áo in xong và bàn giao cho đơn vị vận chuyển.
         </p>`,
      )
    : block(
        "Muốn đặt lại?",
        `<p style="margin:0;color:${BRAND.ink};font-size:14px;line-height:1.6;">
           Bạn chỉnh lại file theo góp ý ở trên rồi thiết kế một mẫu mới trên web là được.
           Shop giữ nguyên mức giá cũ cho bạn.
         </p>`,
      );

  const html = renderShell({
    title: heading,
    preheader: approved
      ? `Mẫu ${mail.designCode} đã được duyệt và đang vào xưởng.`
      : `Mẫu ${mail.designCode} chưa in được — xem lý do bên trong.`,
    heading,
    lead,
    badge: mail.orderCode ? `Đơn hàng <b>${esc(mail.orderCode)}</b>` : undefined,
    sections: reason + details + (approved ? next : refundBlock(mail) + next),
    recipient: mail.customerEmail,
    reason: "vì bạn vừa đặt in áo tại shop.",
  });

  const text = [
    heading,
    "",
    `Mẫu: ${mail.designCode}${mail.orderCode ? ` · Đơn ${mail.orderCode}` : ""}`,
    `${mail.blankName} · ${mail.colorName} · size ${mail.size} · ${mail.qty} áo`,
    `Thành tiền: ${formatPrice(mail.totalPrice)}`,
    mail.note ? `\n${approved ? "Ghi chú" : "Lý do"}: ${mail.note}` : "",
    !approved && mail.paid ? `\nShop sẽ hoàn lại ${formatPrice(mail.totalPrice)}.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return deliver({
    to: mail.customerEmail,
    subject: approved
      ? `Đã duyệt thiết kế ${mail.designCode}`
      : `Thiết kế ${mail.designCode} chưa in được`,
    html,
    text,
  });
}
