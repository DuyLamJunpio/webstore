/**
 * Những mảnh dùng chung giữa hai đường nhập hàng — API chính thức
 * (`sync-shopee.mts`) và file JSON lưu từ trình duyệt (`import-shopee.mts`):
 * slug, đoán mã màu, và cách in ra `lib/catalogue.generated.ts`.
 */

/**
 * slug, mã màu và đối tượng nằm ở `lib/seed-helpers.ts` để web dùng chung khi
 * đọc thẳng trang quản trị lúc chạy. Re-export ở đây cho các script cũ.
 */
export { audienceFor, hexFor, slugify } from "../lib/seed-helpers.js";

// ── đoán danh mục và đối tượng từ tên sản phẩm ───────────────────────

/**
 * Chỉ dùng khi không có danh mục thật: đường nhập qua API lấy thẳng tên danh mục
 * Shopee đã gán cho sản phẩm, chính xác hơn hẳn việc dò từ khoá trong tên.
 */
const CATEGORY_HINTS: Array<[RegExp, string]> = [
  [/hoodie|nỉ có mũ/i, "Hoodie"],
  [/cardigan/i, "Cardigan"],
  [/áo khoác|jacket|blazer|bomber|phao|dạ/i, "Áo khoác"],
  [/sơ ?mi|shirt(?!s)/i, "Áo sơ mi"],
  [/áo len|sweater|dệt kim|knit/i, "Áo len"],
  [/áo thun|t-?shirt|tee|polo/i, "Áo thun"],
  [/chân váy|váy|đầm|dress|skirt/i, "Váy đầm"],
  [/quần|pants|jean|short|jogger/i, "Quần"],
  [/set|bộ /i, "Set đồ"],
  [/túi|bag|balo/i, "Phụ kiện"],
];

export const categoryFor = (name: string) =>
  CATEGORY_HINTS.find(([re]) => re.test(name))?.[1] ?? "Khác";

// ── tải ảnh ──────────────────────────────────────────────────────────

import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";

/** Trả về false nếu tải hỏng; nơi gọi tự quyết định bỏ qua sản phẩm hay không. */
export async function downloadImage(url: string, target: string): Promise<boolean> {
  if (existsSync(target)) return true;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "image/jpeg,image/webp,image/*" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      console.warn(`   ! ảnh ${url} → HTTP ${response.status}`);
      return false;
    }
    await writeFile(target, Buffer.from(await response.arrayBuffer()));
    return true;
  } catch (error) {
    console.warn(`   ! ảnh ${url} → ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

// ── sinh mã ──────────────────────────────────────────────────────────

/** JSON.stringify cho ra chuỗi TS hợp lệ và an toàn với dấu nháy, tiếng Việt */
export const lit = (value: unknown) => JSON.stringify(value);

export function renderSeed(seed: Record<string, unknown>, warnings: string[]): string {
  const lines = [`  {`];
  for (const [key, value] of Object.entries(seed)) {
    if (value === undefined) continue;
    if (key === "colors" || key === "variants" || key === "details") {
      const rows = (value as unknown[]).map((row) => `      ${lit(row)},`).join("\n");
      lines.push(rows ? `    ${key}: [\n${rows}\n    ],` : `    ${key}: [],`);
    } else {
      lines.push(`    ${key}: ${lit(value)},`);
    }
  }
  if (!seed.description) warnings.push(String(seed.slug));
  lines.push(`  },`);
  return lines.join("\n");
}
