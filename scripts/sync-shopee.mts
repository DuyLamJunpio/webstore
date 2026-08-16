/**
 * Đồng bộ cửa hàng từ Shopee Open Platform v2 → catalogue của web.
 *
 *   npm run sync:shopee            # toàn bộ sản phẩm đang bán
 *   npm run sync:shopee -- --limit 20
 *   npm run sync:shopee -- --status UNLIST
 *
 * Lấy về, theo đúng thứ tự đó: cây danh mục (get_category) → danh sách sản phẩm
 * (get_item_list) → thông tin và giá (get_item_base_info) → phân loại kèm TỒN KHO
 * THẬT của từng màu × size (get_model_list) → lượt bán để xếp "bán chạy"
 * (get_item_extra_info). Ảnh tải về `public/images/shopee/`, dữ liệu ghi ra
 * `lib/catalogue.generated.ts`.
 *
 * Cần chạy `npm run shopee:auth` một lần trước đó.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import type {
  ItemBaseInfo,
  ItemStatus,
  ModelList,
  ShopeeCategory,
} from "../lib/shopee/products";
import {
  audienceFor,
  categoryFor,
  downloadImage,
  hexFor,
  lit,
  renderSeed,
  slugify,
} from "./seed-format.mjs";

// @next/env là CommonJS, không có named export cho ESM — nạp qua createRequire.
const { loadEnvConfig } = createRequire(import.meta.url)("@next/env") as {
  loadEnvConfig: (dir: string, dev?: boolean) => unknown;
};

// Phải nạp .env TRƯỚC khi import lib/shopee/*: những file đó đọc process.env ngay
// lúc nạp module, env còn trống thì partner_id thành 0 và mọi chữ ký đều sai.
loadEnvConfig(process.cwd(), true);

const {
  categoryPath,
  getCategories,
  getItemBaseInfo,
  getItemExtraInfo,
  getItemIds,
  getModelList,
} = await import("@/lib/shopee/products");

const IMAGE_DIR = path.join(process.cwd(), "public", "images", "shopee");
const OUT_FILE = path.join(process.cwd(), "lib", "catalogue.generated.ts");

/** Bao nhiêu sản phẩm được gọi get_model_list cùng lúc. Shopee cho 1.000 lượt/phút. */
const MODEL_CONCURRENCY = 5;

// ── tham số dòng lệnh ────────────────────────────────────────────────

function parseArgs(argv: string[]) {
  let limit = Infinity;
  let status: ItemStatus = "NORMAL";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--limit") limit = Number(argv[++i]);
    else if (arg === "--status") status = argv[++i]?.toUpperCase() as ItemStatus;
    else throw new Error(`Không hiểu tham số "${arg}". Chỉ có --limit <n> và --status <NORMAL|UNLIST>.`);
  }
  if (!Number.isFinite(limit) && limit !== Infinity) throw new Error("--limit phải là số.");
  return { limit, status };
}

// ── chạy song song có giới hạn ───────────────────────────────────────

async function mapLimited<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (let i = cursor++; i < items.length; i = cursor++) {
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

// ── mô tả: HTML của Shopee → vài dòng chữ sạch ───────────────────────

const stripHtml = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .trim();

/**
 * Mô tả Shopee thường là một khối dài kèm hashtag và cam kết vận chuyển. Đoạn
 * đầu làm phần giới thiệu, các dòng ngắn còn lại thành gạch đầu dòng "Chi tiết".
 */
function splitDescription(raw: string): { description: string; details: string[] } {
  const lines = stripHtml(raw)
    .split("\n")
    .map((line) => line.replace(/^[-•*+➤✅▪️❤️🔥]+\s*/u, "").trim())
    .filter((line) => line.length > 0 && !/^#\S/.test(line));

  if (lines.length === 0) return { description: "", details: [] };

  const description = lines[0].slice(0, 400);
  const details = lines
    .slice(1)
    .filter((line) => line.length >= 8 && line.length <= 120)
    .slice(0, 6);
  return { description, details };
}

// ── biến thể: tier_variation + model → colors/sizes/variants ─────────

const isColorTier = (name: string) => /màu|color|mau/i.test(name);
const isSizeTier = (name: string) => /size|kích|cỡ|co /i.test(name);

type BuiltVariants = {
  colors: Array<{ name: string; hex: string }>;
  sizes: string[];
  variants: Array<{ id: string; color: string; size: string; stock: number }>;
  /** giá thấp nhất còn bán được, dùng khi giá ở cấp sản phẩm không có */
  minPrice: number;
  optionImages: Map<string, string>;
};

function buildVariants(slug: string, models: ModelList, fallbackStock: number): BuiltVariants {
  const tiers = models.tier_variation ?? [];
  const colorIndex = tiers.findIndex((t) => isColorTier(t.name ?? ""));
  const sizeIndex = tiers.findIndex((t) => isSizeTier(t.name ?? ""));

  // shop đặt tên tier tuỳ hứng ("Phân loại 1"): tier đầu coi là màu, tier hai là size
  const ci = colorIndex >= 0 ? colorIndex : tiers.length > 0 && sizeIndex !== 0 ? 0 : -1;
  const si = sizeIndex >= 0 ? sizeIndex : ci === 0 && tiers.length > 1 ? 1 : -1;

  const colorNames = tiers[ci]?.option_list?.map((o) => o.option ?? "").filter(Boolean) ?? ["Mặc định"];
  const sizeNames = tiers[si]?.option_list?.map((o) => o.option ?? "").filter(Boolean) ?? ["Freesize"];

  // ảnh riêng của từng màu, Shopee gắn ở option_list — dùng làm ảnh hover khi có
  const optionImages = new Map<string, string>();
  for (const option of tiers[ci]?.option_list ?? []) {
    if (option.option && option.image?.image_url) optionImages.set(option.option, option.image.image_url);
  }

  const stockOf = new Map<string, number>();
  let minPrice = Infinity;

  for (const model of models.model ?? []) {
    const stock = model.stock_info_v2?.summary_info?.total_available_stock ?? 0;
    const price = model.price_info?.[0]?.current_price ?? 0;
    if (price > 0 && stock > 0) minPrice = Math.min(minPrice, price);

    const color = ci >= 0 ? (colorNames[model.tier_index?.[ci] ?? -1] ?? colorNames[0]) : colorNames[0];
    const size = si >= 0 ? (sizeNames[model.tier_index?.[si] ?? -1] ?? sizeNames[0]) : sizeNames[0];
    // hai model cùng rơi vào một ô (tier thứ ba mà web không hiển thị) thì cộng dồn
    const key = `${color}|${size}`;
    stockOf.set(key, (stockOf.get(key) ?? 0) + stock);
  }

  const hasModels = (models.model ?? []).length > 0;
  const variants = colorNames.flatMap((color) =>
    sizeNames.map((size) => ({
      id: `${slug}__${color}__${size}`,
      color,
      size,
      // sản phẩm không có phân loại: tồn kho cấp sản phẩm chính là tồn của ô duy nhất
      stock: hasModels ? (stockOf.get(`${color}|${size}`) ?? 0) : fallbackStock,
    })),
  );

  return {
    colors: colorNames.map((name) => ({ name, hex: hexFor(name) })),
    sizes: sizeNames,
    variants,
    minPrice: Number.isFinite(minPrice) ? minPrice : 0,
    optionImages,
  };
}

// ── chạy ─────────────────────────────────────────────────────────────

async function main() {
  const { limit, status } = parseArgs(process.argv.slice(2));

  console.log("→ Lấy cây danh mục…");
  const categoryList = await getCategories();
  const categories = new Map<number, ShopeeCategory>(categoryList.map((c) => [c.category_id, c]));
  console.log(`  ${categories.size} danh mục.`);

  console.log(`→ Lấy danh sách sản phẩm (${status})…`);
  let itemIds = await getItemIds(status);
  console.log(`  ${itemIds.length} sản phẩm.`);
  if (Number.isFinite(limit) && itemIds.length > limit) {
    itemIds = itemIds.slice(0, limit);
    console.log(`  → chỉ đồng bộ ${itemIds.length} sản phẩm đầu (--limit).`);
  }
  if (itemIds.length === 0) {
    throw new Error("Shop không có sản phẩm nào ở trạng thái này — chưa ghi đè catalogue hiện tại.");
  }

  console.log("→ Lấy thông tin và giá…");
  const infos = await getItemBaseInfo(itemIds);

  console.log("→ Lấy lượt bán…");
  // số liệu này chỉ để xếp hạng, thiếu thì trang vẫn chạy nên không cho ném lỗi
  const extras = await getItemExtraInfo(itemIds).catch((error) => {
    console.warn(`  ! không lấy được lượt bán: ${error instanceof Error ? error.message : error}`);
    return [];
  });
  const soldOf = new Map(extras.map((e) => [e.item_id, e]));

  console.log(`→ Lấy phân loại và tồn kho (${infos.length} sản phẩm)…`);
  const modelLists = await mapLimited(infos, MODEL_CONCURRENCY, async (info) => {
    if (info.has_model === false) return {} as ModelList;
    return getModelList(info.item_id).catch((error) => {
      console.warn(`  ! ${info.item_name}: ${error instanceof Error ? error.message : error}`);
      return {} as ModelList;
    });
  });

  await mkdir(IMAGE_DIR, { recursive: true });
  console.log("→ Tải ảnh và sinh catalogue…");

  const usedSlugs = new Set<string>();
  const seeds: string[] = [];
  const missingDescription: string[] = [];
  const categoryCount = new Map<string, number>();
  let downloaded = 0;
  let skipped = 0;

  for (const [index, info] of infos.entries()) {
    const item: ItemBaseInfo = info;

    // Shopee cho phép trùng tên; slug phải là duy nhất vì nó là URL
    let slug = slugify(item.item_name);
    if (usedSlugs.has(slug)) slug = `${slug}-${item.item_id}`;
    usedSlugs.add(slug);

    const totalStock = item.stock_info_v2?.summary_info?.total_available_stock ?? 0;
    const built = buildVariants(slug, modelLists[index], totalStock);

    // ảnh: tấm đầu là ảnh chính, tấm hai dùng cho hiệu ứng hover
    const urls = [...(item.image?.image_url_list ?? [])];
    const firstOptionImage = built.optionImages.values().next().value;
    if (urls.length < 2 && firstOptionImage) urls.push(firstOptionImage);

    const localPaths: string[] = [];
    for (const [i, url] of urls.slice(0, 2).entries()) {
      const file = `${slug}-${i + 1}.jpg`;
      if (await downloadImage(url, path.join(IMAGE_DIR, file))) {
        localPaths.push(`/images/shopee/${file}`);
        downloaded++;
      }
    }
    if (localPaths.length === 0) {
      console.warn(`   ! bỏ qua "${item.item_name}" — không tải được ảnh nào`);
      skipped++;
      continue;
    }

    // giá: cấp sản phẩm trước, không có thì lấy giá thấp nhất trong các phân loại
    const priceInfo = item.price_info?.[0];
    const price = Math.round(priceInfo?.current_price || built.minPrice);
    const before = Math.round(priceInfo?.original_price ?? 0);

    const trail = item.category_id ? categoryPath(categories, item.category_id) : [];
    // danh mục hiển thị = lá của cây Shopee; shop chưa gán thì mới đoán theo tên
    const category = trail.at(-1) ?? categoryFor(item.item_name);
    categoryCount.set(category, (categoryCount.get(category) ?? 0) + 1);

    const extra = soldOf.get(item.item_id);
    const { description, details } = splitDescription(item.description ?? "");

    const seed: Record<string, unknown> = {
      slug,
      name: item.item_name,
      category,
      audience: audienceFor(item.item_name, trail.join(" ")),
      price,
      ...(before > price ? { comparePrice: before } : {}),
      image: localPaths[0],
      hoverImage: localPaths[1] ?? localPaths[0],
      // "mới" = lên sàn trong 30 ngày gần đây
      ...(item.create_time && Date.now() / 1000 - item.create_time < 30 * 86_400 ? { isNew: true } : {}),
      rating: Number((extra?.rating?.rating_star ?? 0).toFixed(1)),
      reviews: extra?.comment_count ?? 0,
      /** lượt bán tích luỹ — khối "Bán chạy nhất" xếp theo con số này */
      sold: extra?.sale ?? 0,
      /** giữ item_id để lần đồng bộ sau đối chiếu, và để link sang gian hàng Shopee */
      shopeeItemId: item.item_id,
      description,
      details,
      colors: built.colors,
      sizes: built.sizes,
      variants: built.variants,
    };

    seeds.push(renderSeed(seed, missingDescription));
  }

  const topCategories = [...categoryCount.entries()].sort((a, b) => b[1] - a[1]);

  const output = `/**
 * SINH TỰ ĐỘNG từ Shopee Open Platform — đừng sửa tay, chạy lại sẽ mất.
 *
 *   npm run sync:shopee
 *
 * ${seeds.length} sản phẩm, đồng bộ lúc ${new Date().toISOString()}.
 * Giá tính bằng đồng, tồn kho là tồn kho thật của từng phân loại tại thời điểm trên.
 */

import type { Seed } from "./data";

export const shopeeSeeds: Seed[] = [
${seeds.join("\n")}
];

/** Danh mục thật của shop, xếp theo số sản phẩm giảm dần. */
export const shopeeCategories: Array<{ name: string; count: number }> = [
${topCategories.map(([name, count]) => `  { name: ${lit(name)}, count: ${count} },`).join("\n")}
];

export const importedAt: string | null = ${lit(new Date().toISOString())};
`;

  await writeFile(OUT_FILE, output, "utf8");

  console.log(`\n✓ ${seeds.length} sản phẩm → lib/catalogue.generated.ts`);
  console.log(`✓ ${downloaded} ảnh → public/images/shopee/`);
  console.log(`✓ ${topCategories.length} danh mục: ${topCategories.slice(0, 5).map(([n]) => n).join(", ")}`);
  if (skipped > 0) console.log(`⚠ ${skipped} sản phẩm bị bỏ qua vì không tải được ảnh.`);
  if (missingDescription.length > 0) {
    console.log(
      `⚠ ${missingDescription.length} sản phẩm chưa có mô tả — trên Shopee cũng trống, hoặc mô tả ở\n` +
        `  dạng ảnh. Điền tay thì phải điền ở Shopee rồi đồng bộ lại, sửa file sinh ra sẽ mất.`,
    );
  }
}

main().catch((error) => {
  console.error(`\n✗ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
