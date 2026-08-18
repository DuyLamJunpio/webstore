/**
 * Chụp lại catalogue từ trang quản trị (Laravel) làm BẢN DỰ PHÒNG cho web.
 *
 *   npm run sync:warehouse
 *
 * KHÔNG cần chạy sau mỗi lần sửa sản phẩm nữa: web đọc thẳng trang quản trị lúc
 * chạy (`lib/catalogue.ts`) và trang quản trị gọi `/api/revalidate` ngay khi
 * lưu, nên thay đổi tự lên web.
 *
 * Bản chụp này chỉ được dùng khi web không gọi được trang quản trị — máy chủ
 * quản trị tắt, mạng nội bộ hỏng. Ảnh tải về `public/images/warehouse/` để lúc
 * đó trang vẫn còn ảnh mà hiển thị. Chạy lại khi muốn bản dự phòng mới hơn,
 * chẳng hạn trước lúc deploy.
 *
 * Tồn kho trong bản chụp có thể cũ, nhưng không bán quá được: lúc đặt hàng,
 * máy chủ quản trị kiểm tra lại tồn và từ chối nếu thiếu.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import nodePath from "node:path";
import { downloadImage, lit, renderSeed } from "./seed-format.mjs";
import {
  MAX_GALLERY,
  mediaUrl,
  toSeed,
  type ApiCategory,
  type ApiResponse,
} from "../lib/warehouse-map.js";

const { loadEnvConfig } = createRequire(import.meta.url)("@next/env") as {
  loadEnvConfig: (dir: string, dev?: boolean) => unknown;
};
loadEnvConfig(process.cwd(), true);

// ── cấu hình ─────────────────────────────────────────────────────────

const BASE = (process.env.WAREHOUSE_API_URL ?? "").replace(/\/$/, "");

if (!BASE) {
  console.error(
    "\nThiếu WAREHOUSE_API_URL trong .env\n" +
      "  Ví dụ: WAREHOUSE_API_URL=http://192.168.100.91:8000\n" +
      "  Đây là địa chỉ trang quản trị Laravel, không phải địa chỉ web bán hàng.\n",
  );
  process.exit(1);
}

const IMAGE_DIR = nodePath.join(process.cwd(), "public", "images", "warehouse");
const OUT_FILE = nodePath.join(process.cwd(), "lib", "catalogue.generated.ts");

const IMAGE_DIR_NAME = "warehouse";

// ── nạp dữ liệu ──────────────────────────────────────────────────────

async function fetchCatalogue(): Promise<ApiResponse> {
  const url = `${BASE}/api/storefront/products`;
  console.log(`→ đọc ${url}`);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error(
      `${url} trả về HTTP ${response.status}. ` +
        `Kiểm tra trang quản trị đã chạy chưa và WAREHOUSE_API_URL có đúng không.`,
    );
  }

  return (await response.json()) as ApiResponse;
}

/**
 * Tải ảnh của một sản phẩm về local. Trả về đường dẫn dùng được trên web —
 * rỗng khi sản phẩm chưa có ảnh nào tải được.
 */
async function localiseImages(slug: string, paths: string[]): Promise<string[]> {
  const saved: string[] = [];

  for (const [index, path] of paths.slice(0, MAX_GALLERY).entries()) {
    const absolute = new URL(mediaUrl(path, BASE));
    const ext = nodePath.extname(absolute.pathname) || ".jpg";
    const name = `${slug}-${index + 1}${ext}`;
    const ok = await downloadImage(absolute.href, nodePath.join(IMAGE_DIR, name));
    if (ok) saved.push(`/images/${IMAGE_DIR_NAME}/${name}`);
  }

  return saved;
}

// ── ghi file ─────────────────────────────────────────────────────────

function render(
  seeds: string[],
  categories: ApiCategory[],
  categoryImages: Map<number, string>,
  syncedAt: string,
): string {
  // Danh mục con mới là nơi gắn sản phẩm, dùng cho tab lọc "Bán chạy".
  const categoryRows = categories
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((c) => `  { name: ${lit(c.name)}, count: ${c.count} },`)
    .join("\n");

  // Danh mục gốc dùng cho các ô "Mua theo danh mục" ở trang chủ. Số sản phẩm
  // của một nhánh là tổng của các danh mục con, vì sản phẩm gắn vào danh mục con.
  const childCount = (parentId: number) =>
    categories.filter((c) => c.parent_id === parentId).reduce((sum, c) => sum + c.count, 0);

  const rootRows = categories
    .filter((c) => c.parent_id === null)
    .map((c) => ({ ...c, total: c.count + childCount(c.id) }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .map(
      (c) =>
        `  { name: ${lit(c.name)}, slug: ${lit(c.slug)}, image: ${lit(
          categoryImages.get(c.id) ?? null,
        )}, count: ${c.total}, children: ${lit(
          categories.filter((x) => x.parent_id === c.id).map((x) => x.name),
        )} },`,
    )
    .join("\n");

  return `/**
 * SINH TỰ ĐỘNG — đừng sửa tay, chạy lại sẽ mất.
 *
 *   npm run sync:warehouse
 *
 * Nguồn: trang quản trị (Laravel). Sửa sản phẩm bên đó rồi chạy lại lệnh trên.
 */

import type { Seed } from "./data";

export const shopeeSeeds: Seed[] = [
${seeds.join("\n")}
];

/** Danh mục con thật của shop, xếp theo số sản phẩm giảm dần. */
export const shopeeCategories: Array<{ name: string; count: number }> = [
${categoryRows}
];

/**
 * Danh mục gốc, dùng cho các ô "Mua theo danh mục" ở trang chủ.
 * count là tổng sản phẩm của cả nhánh (gốc + các danh mục con).
 */
export const rootCategories: Array<{
  name: string;
  slug: string;
  image: string | null;
  count: number;
  children: string[];
}> = [
${rootRows}
];

/** để README / trang quản trị biết dữ liệu lấy lúc nào */
export const importedAt: string | null = ${lit(syncedAt)};
`;
}

// ── chạy ─────────────────────────────────────────────────────────────

async function main() {
  const data = await fetchCatalogue();

  if (data.products.length === 0) {
    console.error(
      "\nTrang quản trị chưa có sản phẩm nào đang bán.\n" +
        "  Thêm sản phẩm bên quản trị rồi chạy lại lệnh này.\n",
    );
    process.exit(1);
  }

  await mkdir(IMAGE_DIR, { recursive: true });

  const warnings: string[] = [];
  const noImage: string[] = [];
  const seeds: string[] = [];

  for (const product of data.products) {
    const gallery = await localiseImages(product.slug, product.images);
    if (gallery.length === 0) noImage.push(product.name);
    seeds.push(renderSeed(toSeed(product, gallery) as unknown as Record<string, unknown>, warnings));
    console.log(
      `   ✓ ${product.name} — ${product.variants.length} biến thể, tồn ${product.total_stock}`,
    );
  }

  // Ảnh danh mục cũng tải về local như ảnh sản phẩm.
  const categoryImages = new Map<number, string>();
  for (const category of data.categories) {
    if (!category.image) continue;
    const absolute = new URL(mediaUrl(category.image, BASE));
    const ext = nodePath.extname(absolute.pathname) || ".jpg";
    const name = `danh-muc-${category.slug}${ext}`;
    if (await downloadImage(absolute.href, nodePath.join(IMAGE_DIR, name))) {
      categoryImages.set(category.id, `/images/${IMAGE_DIR_NAME}/${name}`);
    }
  }

  await writeFile(OUT_FILE, render(seeds, data.categories, categoryImages, data.synced_at), "utf8");

  console.log(`\n✓ Đã ghi ${data.products.length} sản phẩm vào lib/catalogue.generated.ts`);

  if (noImage.length) {
    console.warn(
      `\n⚠  ${noImage.length} sản phẩm chưa có ảnh, đang dùng ảnh thay thế:\n` +
        noImage.map((n) => `     - ${n}`).join("\n") +
        `\n   Tải ảnh lên ở trang quản trị → Sản phẩm → Sửa, rồi chạy lại lệnh này.`,
    );
  }

  if (warnings.length) {
    console.warn(`\n⚠  ${warnings.length} sản phẩm chưa có mô tả: ${warnings.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(`\n✗ ${error instanceof Error ? error.message : error}\n`);
  process.exit(1);
});
