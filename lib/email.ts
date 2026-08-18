/**
 * Gửi email giao dịch qua SMTP.
 *
 * Server only: mật khẩu không bao giờ được lọt vào gói tải về trình duyệt.
 *
 * Vì sao SMTP chứ không phải Resend/SendGrid: những dịch vụ đó bắt buộc phải
 * có tên miền riêng đã xác thực mới gửi được cho người ngoài — "You must add
 * and verify at least one domain to send emails with Resend". Shop đang chỉ có
 * một hộp Gmail, nên đường duy nhất gửi THẬT SỰ TỪ địa chỉ đó là nói chuyện
 * thẳng với SMTP của Gmail.
 *
 * Đây là ranh giới duy nhất biết thư được gửi bằng cách nào. Sau này có tên
 * miền riêng thì viết lại mỗi `deliver()`; mẫu thư và luồng chống gửi trùng ở
 * `lib/order-email.ts` không phải sửa một dòng nào.
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

const REQUEST_TIMEOUT_MS = 20_000;

type EmailConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  /** dạng `Tên shop <dia-chi@gmail.com>`; mặc định lấy chính tài khoản SMTP */
  from: string;
  /** bản sao về hộp thư của shop, để chủ shop cũng biết có đơn mới */
  bcc?: string;
};

function readConfig(): EmailConfig | null {
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!user || !password) return null;

  return {
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    user,
    password,
    from: process.env.SHOP_EMAIL_FROM || `The Basic Concept <${user}>`,
    bcc: process.env.SHOP_EMAIL_BCC,
  };
}

/** false khi shop chưa cấu hình email — luồng thanh toán vẫn chạy, chỉ là không có thư */
export const isEmailConfigured = () => readConfig() !== null;

export class EmailError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "EmailError";
  }
}

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  /** bản chữ thuần — thiếu nó là điểm trừ với bộ lọc thư rác */
  text: string;
};

/**
 * Một transporter dùng lại cho mọi lần gửi.
 *
 * Nodemailer giữ sẵn kết nối trong pool; dựng mới mỗi lá thư là mỗi lần phải
 * bắt tay TLS và đăng nhập lại, và Gmail xem chuỗi đăng nhập dồn dập là dấu
 * hiệu đáng ngờ.
 */
let cached: { transporter: Transporter; signature: string } | null = null;

function getTransporter(config: EmailConfig): Transporter {
  // đổi cấu hình giữa chừng (sửa .env lúc dev) thì phải dựng lại
  const signature = `${config.host}:${config.port}:${config.user}`;
  if (cached?.signature === signature) return cached.transporter;

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    // 465 là SMTPS (TLS ngay từ đầu); 587 bắt đầu bằng kết nối thường rồi STARTTLS
    secure: config.port === 465,
    auth: { user: config.user, pass: config.password },
    pool: true,
    maxConnections: 2,
    connectionTimeout: REQUEST_TIMEOUT_MS,
    greetingTimeout: REQUEST_TIMEOUT_MS,
    socketTimeout: REQUEST_TIMEOUT_MS,
  });

  cached = { transporter, signature };
  return transporter;
}

/** dịch mã lỗi khô khan của SMTP thành câu đọc được, vì đây là thứ hiện trong log */
function describe(error: unknown): { message: string; code: string } {
  const raw = error as { code?: string; responseCode?: number; message?: string };
  const code = raw?.code ?? (raw?.responseCode ? `smtp_${raw.responseCode}` : "unknown");

  if (code === "EAUTH" || raw?.responseCode === 535) {
    return {
      code: "auth",
      message:
        "Gmail từ chối đăng nhập. SMTP_PASSWORD phải là App Password 16 ký tự " +
        "(Tài khoản Google → Bảo mật → Xác minh 2 bước → Mật khẩu ứng dụng), " +
        "không phải mật khẩu đăng nhập thường.",
    };
  }
  if (code === "ETIMEDOUT" || code === "ECONNECTION" || code === "ESOCKET") {
    return { code, message: "Không kết nối được tới máy chủ SMTP." };
  }
  return { code, message: raw?.message ?? "Gửi thư thất bại." };
}

/**
 * Gửi một email. Ném lỗi khi thất bại; bên gọi quyết định có thử lại không.
 *
 * Cố ý KHÔNG nuốt lỗi ở đây: nơi gọi cần biết để còn mở lại cờ "đã gửi", nếu
 * không thì một lần mạng chập là khách vĩnh viễn không nhận được thư xác nhận.
 */
export async function deliver(email: OutgoingEmail): Promise<{ id: string }> {
  const config = readConfig();
  if (!config) throw new EmailError("Chưa cấu hình email.", "not_configured");

  try {
    const info = await getTransporter(config).sendMail({
      from: config.from,
      to: email.to,
      ...(config.bcc ? { bcc: config.bcc } : {}),
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    return { id: info.messageId };
  } catch (error) {
    const { message, code } = describe(error);
    throw new EmailError(message, code);
  }
}

/**
 * Bắt tay thử với máy chủ SMTP mà không gửi thư nào.
 * Dùng cho `npm run email:test` để tách bạch "sai mật khẩu" và "thư bị chặn".
 */
export async function verifyConnection(): Promise<void> {
  const config = readConfig();
  if (!config) throw new EmailError("Chưa cấu hình email.", "not_configured");

  try {
    await getTransporter(config).verify();
  } catch (error) {
    const { message, code } = describe(error);
    throw new EmailError(message, code);
  }
}
