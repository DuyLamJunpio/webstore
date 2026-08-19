/**
 * Khung chung của mọi thư gửi cho khách.
 *
 * Shop có hai loại thư — "đã nhận thanh toán" và "đơn hàng đổi trạng thái" — và
 * chúng phải trông như đến từ cùng một cửa hàng. Đầu thư, chân thư, bảng màu và
 * mấy khối nội dung nằm ở đây; mỗi loại thư chỉ viết phần ruột của nó.
 *
 * Lưu ý khi dùng: những tham số nhận HTML (`lead`, `badge`, `sections`) KHÔNG
 * được escape ở đây, vì chúng chứa thẻ thật. Dữ liệu khách nhập đi vào đó phải
 * qua `esc()` trước — tên và địa chỉ là do người lạ gõ vào.
 */

import { CONTACT } from "./contact";

/** Chặn dữ liệu khách nhập phá vỡ HTML của thư — tên và địa chỉ là do người lạ gõ vào */
export const esc = (value: string) =>
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
export const formatMoment = (ms: number) => {
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

export const BRAND = {
  ink: "#1c1714",
  cream: "#f5efe6",
  creamDark: "#eae1d3",
  surface: "#fbf8f2",
  gold: "#a8804b",
  muted: "#7a726b",
  line: "#ded5c7",
};

/** một dòng nhãn - giá trị, dùng cho khối tổng tiền */
export const row = (label: string, value: string) => `
    <tr>
      <td style="padding:4px 0;color:${BRAND.muted};font-size:14px;white-space:nowrap;">${esc(label)}</td>
      <td style="padding:4px 0 4px 16px;color:${BRAND.ink};font-size:14px;text-align:right;">${esc(value)}</td>
    </tr>`;

/** một mục có tiêu đề nhỏ màu vàng đồng, ví dụ "Người nhận" */
export const block = (title: string, body: string) => `
    <tr><td style="padding:28px 0 0;">
      <div style="color:${BRAND.gold};font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding-bottom:10px;">${esc(title)}</div>
      ${body}
    </td></tr>`;

export type EmailShell = {
  /** thẻ <title>, chỉ vài ứng dụng thư hiện nó */
  title: string;
  /** dòng xem trước trong hộp thư, ẩn khỏi nội dung thư */
  preheader: string;
  /** tiêu đề lớn nhất trong thư */
  heading: string;
  /** đoạn mở đầu — HTML, phần dữ liệu khách phải escape trước khi truyền vào */
  lead: string;
  /** viên thông tin nền đậm ngay dưới đoạn mở đầu — HTML */
  badge?: string;
  /** các khối giữa thư, ghép từ `block()` và `row()` — HTML */
  sections: string;
  /** địa chỉ nhận, hiện ở chân thư để khách biết vì sao mình nhận được */
  recipient: string;
  /** nốt cuối của câu "Thư này được gửi tự động tới … <reason>" */
  reason: string;
};

export function renderShell(parts: EmailShell): string {
  const badge = parts.badge
    ? `
    <tr><td style="padding:24px 32px 0;">
      <div style="background:${BRAND.creamDark};border-radius:12px;padding:14px 18px;color:${BRAND.ink};font-size:14px;">
        ${parts.badge}
      </div>
    </td></tr>
`
    : "";

  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(parts.title)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.cream};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(parts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:32px 16px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.surface};border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

    <tr><td style="background:${BRAND.ink};padding:32px 32px 28px;text-align:center;">
      <div style="color:${BRAND.gold};font-size:26px;font-weight:700;letter-spacing:.12em;">TBC</div>
      <div style="color:${BRAND.cream};font-size:11px;letter-spacing:.28em;text-transform:uppercase;padding-top:8px;">The Basic Concept</div>
    </td></tr>

    <tr><td style="padding:32px 32px 0;">
      <h1 style="margin:0;color:${BRAND.ink};font-size:24px;line-height:1.25;">${esc(parts.heading)}</h1>
      <p style="margin:12px 0 0;color:${BRAND.muted};font-size:15px;line-height:1.65;">
        ${parts.lead}
      </p>
    </td></tr>
${badge}
    <tr><td style="padding:0 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${parts.sections}
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
        Thư này được gửi tự động tới ${esc(parts.recipient)} ${esc(parts.reason)}
      </p>
    </td></tr>

  </table>
</td></tr></table>
</body></html>`;
}
