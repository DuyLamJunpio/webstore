/**
 * Hình dạng dữ liệu `/api/storefront/products` trả về, và cách nắn nó thành
 * catalogue của web.
 *
 * Dùng chung cho hai đường: web đọc thẳng lúc chạy (`lib/catalogue.ts`) và
 * script chụp lại bản dự phòng (`npm run sync:warehouse`). Chung một chỗ để hai
 * đường không bao giờ hiểu khác nhau về cùng một sản phẩm.
 */

import type { Audience, Seed } from "./data";
import { audienceFor, hexFor, slugify } from "./seed-helpers";

// ── kiểu dữ liệu trả về từ trang quản trị ────────────────────────────

export type ApiVariant = {
  id: number;
  size: string | null;
  color: string | null;
  sku: string;
  stock: number;
  /** Có bán được dòng này không — quản trị đã tính sẵn cả cờ theo dõi tồn kho. */
  available?: boolean;
  price: number;
};

export type ApiProduct = {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  material: string | null;
  brand: string | null;
  audience: string;
  is_new: boolean;
  created_at: string | null;
  sold: number;
  price: number;
  compare_price: number | null;
  is_featured: boolean;
  /** Quản trị có theo dõi tồn kho mặt hàng này không. Thiếu = có, như trước đây. */
  manage_stock?: boolean;
  in_stock: boolean;
  total_stock: number;
  images: string[];
  videos: string[];
  variants: ApiVariant[];
};

export type ApiCategory = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  image: string | null;
  count: number;
};

export type ApiResponse = {
  synced_at: string;
  products: ApiProduct[];
  categories: ApiCategory[];
};

export type RootCategory = {
  name: string;
  slug: string;
  image: string | null;
  count: number;
  children: string[];
};

/** Ảnh dùng khi sản phẩm chưa có ảnh nào bên quản trị. */
export const PLACEHOLDER = "/images/placeholder.svg";

/**
 * Số tồn gán cho hàng không theo dõi tồn kho (đặt may, hàng order).
 *
 * Cả web tính còn/hết bằng `stock > 0` — ô chọn size, giỏ hàng, bước thanh toán
 * đều vậy. Đổ một con số đủ lớn ở đúng chỗ nắn dữ liệu này khiến mọi nơi hiểu
 * đúng ngay, thay vì rải thêm một điều kiện `manageStock` vào từng chỗ và chắc
 * chắn sót một chỗ nào đó. Đủ lớn để không bao giờ chạm ngưỡng "chỉ còn N sản
 * phẩm" (LOW_STOCK) mà vẫn là số hữu hạn cho ô nhập số lượng.
 */
export const UNLIMITED_STOCK = 9999;

/**
 * Nhiều nhất chừng này ảnh cho một sản phẩm. Trang chi tiết cuộn thumbnail dọc,
 * quá số này là tràn khỏi khung ảnh chính.
 */
export const MAX_GALLERY = 8;

/**
 * API trả về một trong hai dạng: đường dẫn tính từ gốc site ("/storage/...")
 * khi ảnh nằm trên chính máy chủ quản trị, hoặc địa chỉ đầy đủ khi ảnh đã
 * chuyển lên kho ngoài (Supabase Storage).
 *
 * new URL() xử lý gọn cả hai: gặp địa chỉ đầy đủ thì nó bỏ qua `base`.
 */
export const mediaUrl = (path: string, base: string) => new URL(path, base).href;

// ── API → catalogue ──────────────────────────────────────────────────

/**
 * Một sản phẩm bên quản trị thành một seed của web.
 *
 * Ảnh truyền vào từ bên ngoài: khi đọc thẳng thì là địa chỉ trên máy chủ quản
 * trị, khi chụp bản dự phòng thì là file đã tải về `public/images/warehouse/`.
 */
export function toSeed(product: ApiProduct, gallery: string[], videos: string[] = []): Seed {
  // Màu và size lấy từ chính các biến thể đã khai bên quản trị.
  const colorNames = [...new Set(product.variants.map((v) => v.color).filter(Boolean))] as string[];
  const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))] as string[];

  const details = [
    product.material ? `Chất liệu: ${product.material}` : null,
    product.brand ? `Thương hiệu: ${product.brand}` : null,
    sizes.length ? `Có size: ${sizes.join(", ")}` : null,
    colorNames.length ? `Màu: ${colorNames.join(", ")}` : null,
  ].filter(Boolean) as string[];

  // `image`/`hoverImage` phải luôn là ảnh thật: nhiều chỗ (giỏ hàng, đơn hàng,
  // thẻ Open Graph) đưa thẳng vào next/image, đưa đường dẫn .mp4 vào là hỏng.
  // Chỗ biết dùng video là gallery — xem galleryOf() trong lib/data.ts.
  const images = gallery.length > 0 ? gallery : [PLACEHOLDER];

  return {
    slug: product.slug || slugify(product.name),
    name: product.name,
    // Dùng nguyên tên danh mục bên quản trị. KHÔNG chạy qua categoryFor():
    // hàm đó là heuristic thời Shopee, nó viết đè "Quần jean" thành "Quần",
    // "Váy ngắn" thành "Váy đầm"... nên tên trên sản phẩm không còn khớp với
    // danh mục thật, và mọi link lọc theo danh mục đều ra rỗng.
    category: product.category,
    // Đối tượng khai thật bên quản trị; chỉ suy đoán khi chưa khai.
    audience: (product.audience || audienceFor(product.name, product.category)) as Audience,
    price: product.price,
    comparePrice: product.compare_price ?? undefined,
    image: images[0],
    // Ảnh hiện khi rê chuột ở thẻ sản phẩm; chỉ có một ảnh thì dùng lại chính nó.
    hoverImage: images[1] ?? images[0],
    // chỉ ảnh thật, không kèm ảnh giữ chỗ — galleryOf() dựa vào chỗ này để biết
    // sản phẩm đã có ảnh chưa, có rồi mới xếp video ra sau
    gallery,
    videos,
    isNew: product.is_new || undefined,
    createdAt: product.created_at ?? undefined,
    // Chưa có hệ thống đánh giá thật nên để 0; giao diện tự ẩn khi bằng 0.
    rating: 0,
    reviews: 0,
    sold: product.sold || undefined,
    description: product.description ?? "",
    details,
    colors: colorNames.map((name) => ({ name, hex: hexFor(name) })),
    sizes,
    manageStock: product.manage_stock !== false,
    // id của biến thể chính là id bên quản trị, đặt hàng sẽ gửi lại nguyên vẹn.
    variants: product.variants.map((v) => ({
      id: String(v.id),
      color: v.color ?? "Mặc định",
      size: v.size ?? "Freesize",
      stock: product.manage_stock === false ? UNLIMITED_STOCK : v.stock,
      price: v.price,
    })),
  };
}

/** Danh mục con — nơi sản phẩm thực sự được gắn vào — xếp theo số hàng giảm dần. */
export const subCategoriesOf = (categories: ApiCategory[]) =>
  categories
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((c) => ({ name: c.name, count: c.count }));

/**
 * Danh mục gốc cho các ô "Mua theo danh mục" ở trang chủ.
 *
 * Số sản phẩm của một nhánh là tổng của các danh mục con, vì sản phẩm gắn vào
 * danh mục con chứ không gắn vào gốc.
 */
export function rootCategoriesOf(
  categories: ApiCategory[],
  imageOf: (category: ApiCategory) => string | null,
): RootCategory[] {
  const childCount = (parentId: number) =>
    categories.filter((c) => c.parent_id === parentId).reduce((sum, c) => sum + c.count, 0);

  return categories
    .filter((c) => c.parent_id === null)
    .map((c) => ({
      name: c.name,
      slug: c.slug,
      image: imageOf(c),
      count: c.count + childCount(c.id),
      children: categories.filter((x) => x.parent_id === c.id).map((x) => x.name),
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}
