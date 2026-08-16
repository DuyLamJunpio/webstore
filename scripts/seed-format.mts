/**
 * Những mảnh dùng chung giữa hai đường nhập hàng — API chính thức
 * (`sync-shopee.mts`) và file JSON lưu từ trình duyệt (`import-shopee.mts`):
 * slug, đoán mã màu, và cách in ra `lib/catalogue.generated.ts`.
 */

// ── tiếng Việt → slug ASCII ──────────────────────────────────────────

const COMBINING = /[̀-ͯ]/g;

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(COMBINING, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "san-pham";

// ── đoán màu → mã hex cho ô swatch ───────────────────────────────────

/**
 * Shopee chỉ trả về tên phân loại dạng chữ ("Trắng kem", "Xanh navy"), còn giao
 * diện cần một mã màu để vẽ ô tròn. Bảng này dò theo từ khoá; không khớp thì
 * dùng màu be trung tính của thương hiệu — sai màu thì sửa tay một dòng, còn
 * hơn là bịa ra một mã hex ngẫu nhiên.
 */
const COLOR_HINTS: Array<[RegExp, string]> = [
  [/trắng|white|kem|cream|sữa|ivory/i, "#f0e7d8"],
  [/đen|black|mực/i, "#1c1714"],
  [/xám|ghi|grey|gray/i, "#c9c6bd"],
  [/be|beige|nude|cát|sand|kaki|khaki/i, "#d8c4a4"],
  [/nâu|brown|socola|chocolate|cafe|cà phê/i, "#4a3728"],
  [/hồng|pink|ruốc/i, "#e2b3b8"],
  [/đỏ|red|burgundy|đô/i, "#a8503a"],
  [/cam|orange|apricot/i, "#d98441"],
  [/vàng|yellow|mustard|bơ/i, "#d9b45b"],
  [/xanh lá|green|rêu|olive|mint|lá/i, "#6b6a45"],
  [/xanh dương|navy|blue|biển|chàm|denim/i, "#3d4a63"],
  [/tím|purple|lavender|lilac/i, "#8a7aa8"],
];

export const hexFor = (name: string) => COLOR_HINTS.find(([re]) => re.test(name))?.[1] ?? "#d8c4a4";

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

const AUDIENCE_HINTS: Array<[RegExp, "Nam" | "Nữ" | "Trẻ em"]> = [
  [/trẻ em|bé trai|bé gái|kids|baby|em bé/i, "Trẻ em"],
  [/nữ|women|girl|đầm|chân váy/i, "Nữ"],
  [/nam|men(?!t)|boy/i, "Nam"],
];

export const categoryFor = (name: string) =>
  CATEGORY_HINTS.find(([re]) => re.test(name))?.[1] ?? "Khác";

/**
 * Đối tượng suy từ tên sản phẩm và cả đường dẫn danh mục Shopee ("Thời Trang
 * Nam" → Nam). Không khớp gì thì Unisex — bộ lọc vẫn hiện sản phẩm ra.
 */
export const audienceFor = (...texts: string[]) => {
  const haystack = texts.filter(Boolean).join(" ");
  return AUDIENCE_HINTS.find(([re]) => re.test(haystack))?.[1] ?? "Unisex";
};

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
