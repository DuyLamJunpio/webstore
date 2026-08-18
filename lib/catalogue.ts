/**
 * Catalogue lúc chạy — đọc thẳng trang quản trị.
 *
 * Web KHÔNG còn bake catalogue vào lúc build. Sửa sản phẩm bên quản trị là web
 * đổi theo trong vòng một phút, hoặc ngay lập tức nếu quản trị gọi được
 * `/api/revalidate` (xem `app/api/revalidate/route.ts`).
 *
 * Gọi không được thì lùi về bản chụp `lib/catalogue.generated.ts` do
 * `npm run sync:warehouse` ghi ra — thà hiện hàng hơi cũ còn hơn trang trắng.
 * Tồn kho hiển thị có thể lệch trong lúc đó, nhưng không bán quá được: lúc đặt
 * hàng, trang quản trị kiểm tra lại tồn và từ chối nếu thiếu.
 *
 * Chỉ dùng ở phía máy chủ (server component, route handler). Client component
 * nhận dữ liệu qua props.
 */

import { cache } from "react";
import { importedAt, rootCategories, shopeeCategories, shopeeSeeds } from "./catalogue.generated";
import { buildCatalogue, EMPTY_CATALOGUE, type Catalogue } from "./data";
import {
  MAX_GALLERY,
  mediaUrl,
  rootCategoriesOf,
  subCategoriesOf,
  toSeed,
  type ApiResponse,
} from "./warehouse-map";

/** Nhãn cache để trang quản trị xoá được sau khi lưu sản phẩm. */
export const CATALOGUE_TAG = "catalogue";

/**
 * Trần thời gian dữ liệu được phép cũ khi không có ai gọi revalidate.
 * Ngắn hơn nữa thì mỗi lượt khách vào là một lần gọi sang quản trị.
 */
const REVALIDATE_SECONDS = 60;

const TIMEOUT_MS = 10_000;

const BASE = (process.env.WAREHOUSE_API_URL ?? "").replace(/\/$/, "");

async function fetchFromWarehouse(): Promise<Catalogue | null> {
  if (!BASE) {
    console.error("[catalogue] thiếu WAREHOUSE_API_URL — đang dùng bản chụp dự phòng");
    return null;
  }

  try {
    const response = await fetch(`${BASE}/api/storefront/products`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS, tags: [CATALOGUE_TAG] },
    });

    if (!response.ok) {
      console.error(`[catalogue] trang quản trị trả về HTTP ${response.status}`);
      return null;
    }

    const data = (await response.json()) as ApiResponse;

    // Danh sách rỗng gần như luôn là lỗi phía quản trị chứ không phải shop hết
    // hàng thật; lùi về bản chụp thay vì dọn sạch cửa hàng.
    if (!Array.isArray(data.products) || data.products.length === 0) {
      console.error("[catalogue] trang quản trị không trả về sản phẩm nào");
      return null;
    }

    return buildCatalogue({
      seeds: data.products.map((product) =>
        toSeed(
          product,
          product.images.slice(0, MAX_GALLERY).map((path) => mediaUrl(path, BASE)),
        ),
      ),
      rootCategories: rootCategoriesOf(data.categories ?? [], (c) =>
        c.image ? mediaUrl(c.image, BASE) : null,
      ),
      subCategories: subCategoriesOf(data.categories ?? []),
      syncedAt: data.synced_at ?? null,
    });
  } catch (error) {
    console.error("[catalogue] không đọc được trang quản trị", error);
    return null;
  }
}

/** Bản chụp lần chạy `npm run sync:warehouse` gần nhất. */
const snapshot = (): Catalogue =>
  shopeeSeeds.length > 0
    ? buildCatalogue({
        seeds: shopeeSeeds,
        rootCategories,
        subCategories: shopeeCategories,
        syncedAt: importedAt,
        stale: true,
      })
    : EMPTY_CATALOGUE;

/**
 * `cache()` gom mọi lời gọi trong cùng một lượt dựng trang về một lần: trang chủ
 * có sáu khối cùng cần catalogue, không nên dựng lại sáu lần.
 */
export const getCatalogue = cache(async (): Promise<Catalogue> => {
  return (await fetchFromWarehouse()) ?? snapshot();
});
