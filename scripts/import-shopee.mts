/**
 * Nhập sản phẩm từ Shopee vào catalogue của web — ĐƯỜNG DỰ PHÒNG.
 *
 * Có tài khoản Open Platform thì dùng `npm run sync:shopee`: lấy được tồn kho
 * thật của từng phân loại, mô tả, danh mục và lượt bán. Script này chỉ còn dùng
 * khi chưa kịp đăng ký ứng dụng — nó đọc JSON lưu tay từ trình duyệt.
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
import path from "node:path";
import {
  audienceFor,
  categoryFor,
  downloadImage,
  hexFor,
  lit,
  renderSeed,
  slugify,
} from "./seed-format.mjs";

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

// ── tải ảnh ──────────────────────────────────────────────────────────

/** endpoint này chỉ trả về hash ảnh, phải tự ghép với CDN */
const fetchImage = (hash: string, target: string) => downloadImage(`${CDN}/${hash}`, target);

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
      if (await fetchImage(hash, path.join(IMAGE_DIR, file))) {
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

/**
 * Danh mục thật của shop — để trống ở đường nhập này: endpoint danh sách không
 * kèm category_id, danh mục hiển thị được đoán từ tên sản phẩm.
 */
export const shopeeCategories: Array<{ name: string; count: number }> = [];

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
