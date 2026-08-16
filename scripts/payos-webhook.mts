/**
 * Đăng ký URL webhook với PayOS.
 *
 *   npm run payos:webhook -- https://abc-def.trycloudflare.com
 *   npm run payos:webhook                 # lấy từ NEXT_PUBLIC_SITE_URL
 *
 * Việc này cũng làm được bằng tay trong bảng điều khiển PayOS (Kênh thanh toán →
 * Webhook Url), nhưng làm ở đây thì thông báo lỗi đọc được: PayOS gọi thử URL
 * ngay lúc đăng ký và chỉ trả về "không hợp lệ" nếu hỏng, không nói vì sao.
 *
 * Script tự thử URL trước, nên phân biệt được "server chưa chạy", "tunnel chết"
 * và "PayOS từ chối" — ba nguyên nhân trông giống hệt nhau trên giao diện web.
 */

import { createRequire } from "node:module";

// @next/env là CommonJS, không có named export cho ESM — nạp qua createRequire.
// Dùng chính nó (thay vì dotenv) để thứ tự ưu tiên .env.local > .env giống hệt
// những gì `next dev` nhìn thấy; lệch chỗ này là script báo "thiếu khoá" trong
// khi trang web vẫn chạy bình thường.
const { loadEnvConfig } = createRequire(import.meta.url)("@next/env") as {
  loadEnvConfig: (dir: string, dev?: boolean) => unknown;
};

// Phải nạp .env trước khi import lib/payos: readConfig() đọc process.env, và
// isPayosConfigured() sẽ báo thiếu khoá nếu env còn trống ở thời điểm import.
loadEnvConfig(process.cwd(), true);

const { confirmWebhook, isPayosConfigured, PayosError } = await import("@/lib/payos");

const WEBHOOK_PATH = "/api/payos/webhook";
const PROBE_TIMEOUT_MS = 10_000;

const die = (message: string): never => {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
};

/** chấp nhận cả gốc tên miền lẫn URL webhook đầy đủ */
function resolveWebhookUrl(input: string): string {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return die(`"${input}" không phải một URL hợp lệ. Ví dụ: https://abc.trycloudflare.com`);
  }

  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    console.warn(
      `⚠ ${url.origin} không dùng HTTPS — dữ liệu giao dịch sẽ đi qua mạng ở dạng thô.`,
    );
  }

  if (!url.pathname.endsWith(WEBHOOK_PATH)) {
    url.pathname = url.pathname.replace(/\/+$/, "") + WEBHOOK_PATH;
  }
  return url.toString();
}

/** route webhook có sẵn handler GET trả {ok:true} — dùng đúng nó để thử đường truyền */
async function probe(url: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
  } catch (cause) {
    const reason =
      cause instanceof Error && cause.name === "TimeoutError"
        ? `không phản hồi trong ${PROBE_TIMEOUT_MS / 1000}s`
        : "không kết nối được";
    return die(
      [
        `Chính máy này còn ${reason} tới ${url} — PayOS lại càng không.`,
        "  • next dev đã chạy chưa?",
        "  • tunnel (cloudflared/ngrok) còn sống không?",
      ].join("\n"),
    );
  }

  if (!response.ok) {
    return die(`${url} trả về HTTP ${response.status}. PayOS cần một mã 2XX ở URL này.`);
  }
}

// ── chạy ─────────────────────────────────────────────────────────────

const input = process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL;
if (!input) {
  die(
    [
      "Chưa biết đăng ký URL nào.",
      "  npm run payos:webhook -- https://ten-mien-cua-ban",
      "  hoặc đặt NEXT_PUBLIC_SITE_URL trong .env",
    ].join("\n"),
  );
}

if (!isPayosConfigured()) {
  die(
    [
      "Thiếu khoá PayOS. Cần đủ PAYOS_CLIENT_ID, PAYOS_API_KEY và PAYOS_CHECKSUM_KEY trong .env",
      "  (lấy tại https://my.payos.vn → Kênh thanh toán → Thông tin xác thực API)",
    ].join("\n"),
  );
}

const webhookUrl = resolveWebhookUrl(input);

if (new URL(webhookUrl).hostname === "localhost") {
  die(
    [
      `${webhookUrl} chỉ tồn tại trên máy này — PayOS ở ngoài internet không gọi vào được.`,
      "  Mở một tunnel rồi đăng ký địa chỉ công khai của nó:",
      "    cloudflared tunnel --url http://localhost:3000",
      "    ngrok http 3000",
    ].join("\n"),
  );
}

console.log(`\n→ Kiểm tra ${webhookUrl} …`);
await probe(webhookUrl);
console.log("  URL sống, trả về 2XX.");

console.log("→ Gửi đăng ký sang PayOS …");
try {
  await confirmWebhook(webhookUrl);
} catch (error) {
  if (error instanceof PayosError) {
    die(
      [
        `PayOS từ chối: ${error.message} (mã ${error.code})`,
        "  PayOS gọi thử URL này kèm một giao dịch mẫu và cần nhận lại mã 2XX.",
        "  Nếu URL vừa kiểm tra vẫn tốt, khả năng cao là khoá trong .env không thuộc",
        "  kênh thanh toán mà bạn đang mở trên bảng điều khiển.",
      ].join("\n"),
    );
  }
  throw error;
}

console.log(`\n✓ Đã đăng ký webhook: ${webhookUrl}`);
console.log("  Từ giờ PayOS sẽ báo mỗi khi tiền về, kể cả lúc khách đã đóng trình duyệt.\n");
