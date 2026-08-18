/**
 * Thử cấu hình email mà không cần đặt hàng thật.
 *
 *   npm run email:test                    # gửi về chính SMTP_USER
 *   npm run email:test -- ai-do@gmail.com
 *
 * Chạy hai bước tách bạch — bắt tay với máy chủ trước, rồi mới gửi thư — vì
 * hai bước đó hỏng vì hai lý do hoàn toàn khác nhau: sai App Password thì chết
 * ở bước một, còn sai địa chỉ nhận hay bị chặn nội dung thì chết ở bước hai.
 * Gộp lại thì chỉ thấy đúng một dòng "gửi thất bại" và không biết sửa ở đâu.
 */

import { createRequire } from "node:module";

// @next/env là CommonJS, không có named export cho ESM
const { loadEnvConfig } = createRequire(import.meta.url)("@next/env") as {
  loadEnvConfig: (dir: string, dev?: boolean) => unknown;
};
loadEnvConfig(process.cwd(), true);

const { isEmailConfigured, verifyConnection, deliver, EmailError } = await import("@/lib/email");
const { renderOrderConfirmation } = await import("@/lib/order-email");

const die = (message: string): never => {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
};

if (!isEmailConfigured()) {
  die(
    [
      "Thiếu SMTP_USER hoặc SMTP_PASSWORD trong .env",
      "",
      "  SMTP_USER=thebasicconcept.official@gmail.com",
      "  SMTP_PASSWORD=<App Password 16 ký tự>",
      "",
      "App Password lấy tại: Tài khoản Google → Bảo mật → Xác minh 2 bước",
      "→ Mật khẩu ứng dụng. Phải bật Xác minh 2 bước thì mục này mới hiện ra.",
    ].join("\n"),
  );
}

const to = process.argv[2] ?? process.env.SMTP_USER!;

console.log(`\n→ Bắt tay với máy chủ SMTP …`);
try {
  await verifyConnection();
  console.log("  Đăng nhập thành công.");
} catch (error) {
  die(error instanceof EmailError ? `${error.message} (mã ${error.code})` : String(error));
}

/** đơn hàng giả, chỉ để dựng đúng mẫu thư thật mà khách sẽ nhận */
const now = Date.now();
const sample = {
  ref: "THUNGHIEM01",
  orderCode: now,
  createdAt: now,
  expiresAt: now + 1_800_000,
  status: "PAID" as const,
  paidAt: now,
  transactionRef: "FT" + now,
  customer: {
    fullName: "Nguyễn Văn A",
    phone: "0901234567",
    email: to,
    address: "12 Đường số 1",
    ward: "Phường Bến Nghé",
    city: "TP. Hồ Chí Minh",
    note: "Đây là thư thử — không phải đơn hàng thật.",
  },
  cart: {
    lines: [
      {
        id: "thu-nghiem",
        slug: "everyday-hoodie",
        name: "Áo Hoodie Hằng Ngày",
        image: "/images/p-everyday-hoodie-1.png",
        color: "Cát",
        size: "M",
        unitPrice: 1_700_000,
        qty: 1,
        total: 1_700_000,
      },
    ],
    count: 1,
    subtotal: 1_700_000,
    shipping: 0,
    total: 1_700_000,
  },
  payment: {
    provider: "payos" as const,
    bin: "970418",
    bankName: "BIDV",
    accountNumber: "8852909690",
    accountName: "DAO DUY LAM",
    amount: 1_700_000,
    description: "TBC THUNGHIEM",
    qrCode: "",
  },
};

console.log(`→ Gửi thư thử tới ${to} …`);
try {
  const { id } = await deliver(renderOrderConfirmation(sample));
  console.log(`\n✓ Đã gửi. Message-ID: ${id}`);
  console.log("  Kiểm tra hộp thư — nhớ ngó cả mục Spam ở lần gửi đầu tiên.\n");
} catch (error) {
  die(error instanceof EmailError ? `${error.message} (mã ${error.code})` : String(error));
}

process.exit(0);
