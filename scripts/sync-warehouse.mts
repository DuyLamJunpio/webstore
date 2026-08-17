/**
 * Đồng bộ catalogue từ trang quản trị (Laravel) → catalogue của web.
 *
 *   npm run sync:warehouse
 *
 * Nguồn dữ liệu thật của cửa hàng là trang quản trị, không phải Shopee: sản
 * phẩm, giá, biến thể size × màu và tồn kho đều lấy từ đó. Ảnh tải về
 * `public/images/warehouse/` để trang không phụ thuộc vào máy chủ quản trị lúc
 * hiển thị, dữ liệu ghi ra `lib/catalogue.generated.ts`.
 *
 * Chạy lại mỗi khi thêm/sửa sản phẩm bên quản trị. Tồn kho hiển thị có thể cũ
 * giữa hai lần chạy, nhưng không bán quá được: lúc đặt hàng, máy chủ quản trị
 * kiểm tra lại tồn và từ chối nếu thiếu.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import {
  audienceFor,
  downloadImage,
  hexFor,
  lit,
  renderSeed,
  slugify,
} from "./seed-format.mjs";

const { loadEnvConfig } = createRequire(import.meta.url)("@next/env") as {
  loadEnvConfig: (dir: string, dev?: boolean) => unknown;
};
loadEnvConfig(process.cwd(), true);

// ── kiểu dữ liệu trả về từ /api/storefront/products ──────────────────

type ApiVariant = {
  id: number;
  size: string | null;
  color: string | null;
  sku: string;
  stock: number;
  price: number;
};

type ApiProduct = {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  material: string | null;
  brand: string | null;
  audience: string;
  is_new: boolean;
  sold: number;
  price: number;
  compare_price: number | null;
  is_featured: boolean;
  in_stock: boolean;
  total_stock: number;
  images: string[];
  videos: string[];
  variants: ApiVariant[];
};

type ApiCategory = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  image: string | null;
  count: number;
};

type ApiResponse = {
  synced_at: string;
  products: ApiProduct[];
  categories: ApiCategory[];
};

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

const IMAGE_DIR = path.join(process.cwd(), "public", "images", "warehouse");
const OUT_FILE = path.join(process.cwd(), "lib", "catalogue.generated.ts");

/** Ảnh dùng khi sản phẩm chưa có ảnh nào bên quản trị. */
const PLACEHOLDER = "/images/placeholder.svg";

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
 * Tải ảnh về local. Trả về đường dẫn dùng được trên web, hoặc ảnh thay thế.
 */
async function localiseImages(product: ApiProduct): Promise<[string, string]> {
  const saved: string[] = [];

  for (const [index, url] of product.images.slice(0, 2).entries()) {
    // API trả đường dẫn tương đối ("/storage/..."), ghép với địa chỉ trang quản trị.
    const absolute = new URL(url, BASE);
    const ext = path.extname(absolute.pathname) || ".jpg";
    const name = `${product.slug}-${index + 1}${ext}`;
    const ok = await downloadImage(absolute.href, path.join(IMAGE_DIR, name));
    if (ok) saved.push(`/images/warehouse/${name}`);
  }

  if (saved.length === 0) return [PLACEHOLDER, PLACEHOLDER];
  // Chỉ có một ảnh thì ảnh hover dùng lại chính nó.
  return [saved[0], saved[1] ?? saved[0]];
}

// ── dựng seed ────────────────────────────────────────────────────────

function toSeed(product: ApiProduct, image: string, hoverImage: string): Record<string, unknown> {
  // Màu và size lấy từ chính các biến thể đã khai bên quản trị.
  const colorNames = [...new Set(product.variants.map((v) => v.color).filter(Boolean))] as string[];
  const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))] as string[];

  const details = [
    product.material ? `Chất liệu: ${product.material}` : null,
    product.brand ? `Thương hiệu: ${product.brand}` : null,
    sizes.length ? `Có size: ${sizes.join(", ")}` : null,
    colorNames.length ? `Màu: ${colorNames.join(", ")}` : null,
  ].filter(Boolean) as string[];

  return {
    slug: product.slug || slugify(product.name),
    name: product.name,
    // Dùng nguyên tên danh mục bên quản trị. KHÔNG chạy qua categoryFor():
    // hàm đó là heuristic thời Shopee, nó viết đè "Quần jean" thành "Quần",
    // "Váy ngắn" thành "Váy đầm"... nên tên trên sản phẩm không còn khớp với
    // danh mục thật, và mọi link lọc theo danh mục đều ra rỗng.
    category: product.category,
    // Đối tượng khai thật bên quản trị; chỉ suy đoán khi chưa khai.
    audience: product.audience || audienceFor(product.name, product.category),
    price: product.price,
    comparePrice: product.compare_price ?? undefined,
    image,
    hoverImage,
    isNew: product.is_new || undefined,
    // Chưa có hệ thống đánh giá thật nên để 0; giao diện tự ẩn khi bằng 0.
    rating: 0,
    reviews: 0,
    sold: product.sold || undefined,
    description: product.description ?? "",
    details,
    colors: colorNames.map((name) => ({ name, hex: hexFor(name) })),
    sizes,
    // id của biến thể chính là id bên quản trị, đặt hàng sẽ gửi lại nguyên vẹn.
    variants: product.variants.map((v) => ({
      id: String(v.id),
      color: v.color ?? "Mặc định",
      size: v.size ?? "Freesize",
      stock: v.stock,
    })),
  };
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
    const [image, hoverImage] = await localiseImages(product);
    if (image === PLACEHOLDER) noImage.push(product.name);
    seeds.push(renderSeed(toSeed(product, image, hoverImage), warnings));
    console.log(
      `   ✓ ${product.name} — ${product.variants.length} biến thể, tồn ${product.total_stock}`,
    );
  }

  // Ảnh danh mục cũng tải về local như ảnh sản phẩm.
  const categoryImages = new Map<number, string>();
  for (const category of data.categories) {
    if (!category.image) continue;
    const absolute = new URL(category.image, BASE);
    const ext = path.extname(absolute.pathname) || ".jpg";
    const name = `danh-muc-${category.slug}${ext}`;
    if (await downloadImage(absolute.href, path.join(IMAGE_DIR, name))) {
      categoryImages.set(category.id, `/images/warehouse/${name}`);
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
