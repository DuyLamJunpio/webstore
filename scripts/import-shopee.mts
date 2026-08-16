/**
 * Nhập sản phẩm từ Shopee vào catalogue của web.
 *
 *   npm run import:shopee -- ./shopee.json
 *
 * Đầu vào là phản hồi JSON của endpoint `search_items` — mở link dưới đây trong
 * trình duyệt đã đăng nhập Shopee rồi lưu lại (máy chủ tự gọi sẽ bị chặn bởi lớp
 * chống bot của Shopee, còn trình duyệt thật thì không):
 *
 *   https://shopee.vn/api/v4/search/search_items
 *     ?by=pop&limit=100&match_id=<SHOP_ID>&newest=0&order=desc
 *     &page_type=shop&scenario=PAGE_OTHERS&version=2
 *
 * Script sẽ: đọc JSON → tải toàn bộ ảnh về `public/images/shopee/` → sinh
 * `lib/catalogue.generated.ts`. Chạy lại bao nhiêu lần cũng được, ảnh đã có thì bỏ qua.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const CDN = "https://down-vn.img.susercontent.com/file";
const IMAGE_DIR = path.join(process.cwd(), "public", "images", "shopee");
const OUT_FILE = path.join(process.cwd(), "lib", "catalogue.generated.ts");
/** Shopee gửi giá đã nhân 100.000 để tránh số thực */
const PRICE_SCALE = 100_000;

// ── hình dạng dữ liệu Shopee trả về ──────────────────────────────────

type TierVariation = { name?: string; options?: string[]; images?: (string | null)[] };

type ItemBasic = {
  itemid: number;
  shopid: number;
  name: string;
  image?: string;
  images?: string[];
  stock?: number;
  status?: number;
  sold?: number;
  historical_sold?: number;
  ctime?: number;
  price?: number;
  price_min?: number;
  price_before_discount?: number;
  item_rating?: { rating_star?: number; rating_count?: number[] };
  tier_variations?: TierVariation[];
};

type SearchItems = { items?: Array<{ item_basic?: ItemBasic } & Partial<ItemBasic>>; total_count?: number };

// ── tiếng Việt → slug ASCII ──────────────────────────────────────────

const COMBINING = /[̀-ͯ]/g;

const slugify = (value: string) =>
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

const hexFor = (name: string) => COLOR_HINTS.find(([re]) => re.test(name))?.[1] ?? "#d8c4a4";

// ── đoán danh mục và đối tượng từ tên sản phẩm ───────────────────────

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

const categoryFor = (name: string) => CATEGORY_HINTS.find(([re]) => re.test(name))?.[1] ?? "Khác";
const audienceFor = (name: string) => AUDIENCE_HINTS.find(([re]) => re.test(name))?.[1] ?? "Unisex";

// ── tải ảnh ──────────────────────────────────────────────────────────

async function downloadImage(hash: string, target: string): Promise<boolean> {
  if (existsSync(target)) return true;
  try {
    const response = await fetch(`${CDN}/${hash}`, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "image/jpeg,image/webp,image/*" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      console.warn(`   ! ảnh ${hash} → HTTP ${response.status}`);
      return false;
    }
    await writeFile(target, Buffer.from(await response.arrayBuffer()));
    return true;
  } catch (error) {
    console.warn(`   ! ảnh ${hash} → ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

// ── sinh mã ──────────────────────────────────────────────────────────

/** JSON.stringify cho ra chuỗi TS hợp lệ và an toàn với dấu nháy, tiếng Việt */
const lit = (value: unknown) => JSON.stringify(value);

function renderSeed(seed: Record<string, unknown>, warnings: string[]): string {
  const lines = [`  {`];
  for (const [key, value] of Object.entries(seed)) {
    if (value === undefined) continue;
    if (key === "colors" || key === "variants") {
      const rows = (value as Record<string, unknown>[]).map((row) => `      ${lit(row)},`).join("\n");
      lines.push(`    ${key}: [\n${rows}\n    ],`);
    } else {
      lines.push(`    ${key}: ${lit(value)},`);
    }
  }
  if (!seed.description) warnings.push(String(seed.slug));
  lines.push(`  },`);
  return lines.join("\n");
}

// ── chạy ─────────────────────────────────────────────────────────────

async function main() {
  const inputs = process.argv.slice(2);
  if (inputs.length === 0) {
    console.error(
      "Thiếu đường dẫn file JSON.\n" +
        "  npm run import:shopee -- ./shopee.json\n" +
        "  npm run import:shopee -- ./trang-1.json ./trang-2.json   (shop trên 100 sản phẩm)",
    );
    process.exit(1);
  }

  // nhiều file = nhiều trang (offset=0, 100, 200…); gộp lại thành một catalogue
  const collected = new Map<number, ItemBasic>();
  for (const input of inputs) {
    const raw = JSON.parse(await readFile(input, "utf8")) as SearchItems;
    // chấp nhận cả `items[].item_basic` lẫn mảng phẳng, tuỳ endpoint nào được lưu
    const page = (raw.items ?? [])
      .map((entry) => entry.item_basic ?? (entry as ItemBasic))
      .filter((item): item is ItemBasic => Boolean(item?.itemid && item?.name));

    for (const item of page) collected.set(item.itemid, item);
    if (inputs.length > 1) console.log(`  ${path.basename(input)}: ${page.length} sản phẩm`);
  }
  const items = [...collected.values()];

  if (items.length === 0) {
    console.error(
      "Không tìm thấy sản phẩm nào trong file.\n" +
        "Kiểm tra xem file có phải phản hồi của search_items không — nếu nội dung là\n" +
        '{"error":90309999,...} thì Shopee đã chặn, hãy lưu lại từ trình duyệt đã đăng nhập.',
    );
    process.exit(1);
  }

  console.log(`Đọc được ${items.length} sản phẩm từ ${inputs.length} file.`);
  await mkdir(IMAGE_DIR, { recursive: true });

  const usedSlugs = new Set<string>();
  const seeds: string[] = [];
  const missingDescription: string[] = [];
  let downloaded = 0;
  let approxStock = 0;

  for (const item of items) {
    // Shopee cho phép trùng tên; slug phải là duy nhất vì nó là URL
    let slug = slugify(item.name);
    if (usedSlugs.has(slug)) slug = `${slug}-${item.itemid}`;
    usedSlugs.add(slug);

    // ảnh: tấm đầu là ảnh chính, tấm hai dùng cho hiệu ứng hover
    const hashes = (item.images?.length ? item.images : item.image ? [item.image] : []).slice(0, 2);
    const localPaths: string[] = [];
    for (const [index, hash] of hashes.entries()) {
      const file = `${slug}-${index + 1}.jpg`;
      if (await downloadImage(hash, path.join(IMAGE_DIR, file))) {
        localPaths.push(`/images/shopee/${file}`);
        downloaded++;
      }
    }
    if (localPaths.length === 0) {
      console.warn(`   ! bỏ qua "${item.name}" — không tải được ảnh nào`);
      continue;
    }

    const price = Math.round((item.price ?? item.price_min ?? 0) / PRICE_SCALE);
    const before = Math.round((item.price_before_discount ?? 0) / PRICE_SCALE);

    // phân loại: Shopee gọi tier nào là màu, tier nào là size, đọc theo tên tier
    const tiers = item.tier_variations ?? [];
    const colorTier = tiers.find((t) => /màu|color|mau/i.test(t.name ?? ""));
    const sizeTier = tiers.find((t) => /size|kích|co|cỡ/i.test(t.name ?? ""));
    // tier còn lại (nếu shop đặt tên khác) vẫn được dùng làm màu, để không mất phân loại
    const fallbackTier = tiers.find((t) => t !== colorTier && t !== sizeTier);

    const colorNames = (colorTier ?? fallbackTier)?.options?.filter(Boolean) ?? ["Mặc định"];
    const sizeNames = sizeTier?.options?.filter(Boolean) ?? ["Freesize"];

    const colors = colorNames.map((name) => ({ name, hex: hexFor(name) }));

    /**
     * Tồn kho từng biến thể không có trong endpoint này — chỉ có tổng tồn của cả
     * sản phẩm. Chia đều là cách sai ít nhất: không hứa nhiều hơn số hàng thật.
     */
    const totalStock = Math.max(0, item.stock ?? 0);
    const combos = colors.length * sizeNames.length;
    const perVariant = combos > 0 ? Math.floor(totalStock / combos) : 0;
    let remainder = combos > 0 ? totalStock % combos : 0;
    if (combos > 1 && totalStock > 0) approxStock++;

    const variants = colors.flatMap((color) =>
      sizeNames.map((size) => {
        const extra = remainder > 0 ? (remainder--, 1) : 0;
        return {
          id: `${slug}__${color.name}__${size}`,
          color: color.name,
          size,
          stock: perVariant + extra,
        };
      }),
    );

    const ratingCount = item.item_rating?.rating_count;
    const seed: Record<string, unknown> = {
      slug,
      name: item.name,
      category: categoryFor(item.name),
      audience: audienceFor(item.name),
      price,
      ...(before > price ? { comparePrice: before } : {}),
      image: localPaths[0],
      hoverImage: localPaths[1] ?? localPaths[0],
      // "mới" = lên sàn trong 30 ngày gần đây
      ...(item.ctime && Date.now() / 1000 - item.ctime < 30 * 86_400 ? { isNew: true } : {}),
      rating: Number((item.item_rating?.rating_star ?? 0).toFixed(1)),
      reviews: Array.isArray(ratingCount) ? (ratingCount[0] ?? 0) : 0,
      // endpoint danh sách không kèm mô tả — để trống còn hơn bịa nội dung bán hàng
      description: "",
      details: [],
      colors,
      sizes: sizeNames,
      variants,
    };

    seeds.push(renderSeed(seed, missingDescription));
  }

  const header = `/**
 * SINH TỰ ĐỘNG từ Shopee — đừng sửa tay, chạy lại sẽ mất.
 *
 *   npm run import:shopee -- <đường-dẫn-file.json>
 *
 * ${seeds.length} sản phẩm, nhập lúc ${new Date().toISOString()}.
 * Giá tính bằng đồng, đúng bằng giá trên Shopee.
 */

import type { Seed } from "./data";

export const shopeeSeeds: Seed[] = [
${seeds.join("\n")}
];

export const importedAt: string | null = ${lit(new Date().toISOString())};
`;

  await writeFile(OUT_FILE, header, "utf8");

  console.log(`\n✓ ${seeds.length} sản phẩm → lib/catalogue.generated.ts`);
  console.log(`✓ ${downloaded} ảnh → public/images/shopee/`);
  if (approxStock > 0) {
    console.log(
      `\n⚠ ${approxStock} sản phẩm có nhiều phân loại: tồn kho từng phân loại được chia đều từ\n` +
        `  tổng tồn, vì endpoint danh sách không trả về tồn kho theo phân loại.`,
    );
  }
  if (missingDescription.length > 0) {
    console.log(
      `\n⚠ ${missingDescription.length} sản phẩm chưa có mô tả và "details" — hai trường này không\n` +
        `  có trong endpoint danh sách. Điền tay trong file vừa sinh, hoặc bảo tôi lấy thêm.`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
