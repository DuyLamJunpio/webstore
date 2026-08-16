/**
 * Uỷ quyền cửa hàng Shopee cho ứng dụng Open Platform (làm một lần).
 *
 *   npm run shopee:auth
 *
 * Script in ra link uỷ quyền; bạn mở link bằng tài khoản chủ shop, bấm đồng ý,
 * rồi dán lại URL mà trình duyệt bị chuyển tới (có `?code=...&shop_id=...`).
 * Cặp token được ghi vào `.shopee/token.json` và từ đó `npm run sync:shopee`
 * tự làm mới, không phải làm lại bước này — trừ khi bỏ không đồng bộ quá 30 ngày,
 * lúc đó refresh token hết hạn và phải uỷ quyền lại.
 *
 * Dán thẳng cũng được, khỏi phải chờ nhắc:
 *   npm run shopee:auth -- "https://.../callback?code=abc&shop_id=123"
 */

import { createInterface } from "node:readline/promises";
import { createRequire } from "node:module";
import { stdin, stdout } from "node:process";

// @next/env là CommonJS, không có named export cho ESM — nạp qua createRequire.
const { loadEnvConfig } = createRequire(import.meta.url)("@next/env") as {
  loadEnvConfig: (dir: string, dev?: boolean) => unknown;
};

// Phải nạp .env TRƯỚC khi import lib/shopee/client: file đó đọc process.env ngay
// lúc nạp module, env còn trống thì partner_id thành 0 và mọi chữ ký đều sai.
loadEnvConfig(process.cwd(), true);

const { authorizeUrl, exchangeCode, SHOP_ID } = await import("@/lib/shopee/client");

/** Trang này chỉ cần tồn tại trên thanh địa chỉ để đọc `code` — không cần chạy thật. */
const REDIRECT = process.env.SHOPEE_REDIRECT_URL ?? "https://open.shopee.com/";

/** Chấp nhận cả URL đầy đủ lẫn chuỗi code trần. */
function parse(input: string): { code: string; shopId: number } {
  const trimmed = input.trim().replace(/^["']|["']$/g, "");
  if (!trimmed) throw new Error("Chưa nhập gì cả.");

  if (/^https?:\/\//i.test(trimmed)) {
    const url = new URL(trimmed);
    const code = url.searchParams.get("code");
    const shopId = Number(url.searchParams.get("shop_id") ?? SHOP_ID);
    if (!code) throw new Error("URL không có tham số `code` — dán đúng URL sau khi bấm đồng ý.");
    if (!shopId) {
      throw new Error("URL không có `shop_id` và .env cũng chưa khai SHOPEE_SHOP_ID.");
    }
    return { code, shopId };
  }

  if (!SHOP_ID) throw new Error("Nhập code trần thì phải khai SHOPEE_SHOP_ID trong .env.local.");
  return { code: trimmed, shopId: SHOP_ID };
}

async function main() {
  const [given] = process.argv.slice(2);

  let input = given;
  if (!input) {
    console.log("\n1. Mở link sau bằng tài khoản CHỦ SHOP rồi bấm đồng ý:\n");
    console.log(`   ${authorizeUrl(REDIRECT)}\n`);
    console.log("2. Trình duyệt sẽ nhảy sang một URL có `?code=...&shop_id=...`.");
    console.log("   Sao chép nguyên URL đó và dán vào đây.\n");

    const rl = createInterface({ input: stdin, output: stdout });
    input = await rl.question("URL sau khi đồng ý: ");
    rl.close();
  }

  const { code, shopId } = parse(input);
  const token = await exchangeCode(code, shopId);

  console.log(`\n✓ Đã uỷ quyền shop ${token.shop_id}. Token nằm ở .shopee/token.json`);
  console.log(`  Access token hết hạn lúc ${new Date(token.expires_at * 1000).toLocaleString("vi-VN")},`);
  console.log("  script đồng bộ sẽ tự làm mới. Bước tiếp theo: npm run sync:shopee");

  if (SHOP_ID && SHOP_ID !== token.shop_id) {
    console.warn(
      `\n⚠ SHOPEE_SHOP_ID trong .env là ${SHOP_ID} nhưng shop vừa uỷ quyền là ${token.shop_id}.` +
        "\n  Sửa lại .env.local cho khớp, nếu không mọi lệnh gọi sau sẽ bị từ chối chữ ký.",
    );
  }
}

main().catch((error) => {
  console.error(`\n✗ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
