/**
 * Các endpoint sản phẩm của Shopee Open Platform v2 mà cửa hàng cần:
 * danh mục, danh sách sản phẩm, thông tin chi tiết, phân loại + tồn kho,
 * và số liệu đã bán để xếp hạng "bán chạy".
 *
 * Mỗi hàm ở đây tự lo chuyện phân trang và giới hạn kích thước lô của Shopee —
 * nơi gọi chỉ việc `await` một mảng đầy đủ.
 */

import { call, LANGUAGE } from "./client";

/** Shopee chặn ở 1.000 lượt gọi/phút; các lô dưới đây bám sát trần của từng endpoint. */
const ITEM_LIST_PAGE = 100; // get_item_list: tối đa 100
const DETAIL_BATCH = 50; // get_item_base_info / get_item_extra_info: tối đa 50

// ── danh mục ─────────────────────────────────────────────────────────

export type ShopeeCategory = {
  category_id: number;
  parent_category_id: number;
  original_category_name: string;
  display_category_name: string;
  has_children: boolean;
};

/** Toàn bộ cây danh mục của sàn — phẳng, nối với nhau qua `parent_category_id`. */
export async function getCategories(): Promise<ShopeeCategory[]> {
  const data = await call<{ category_list?: ShopeeCategory[] }>({
    path: "/api/v2/product/get_category",
    query: { language: LANGUAGE },
  });
  return data.category_list ?? [];
}

/** Đường đi từ gốc xuống một danh mục, ví dụ ["Thời Trang Nữ", "Áo", "Áo Thun"]. */
export function categoryPath(categories: Map<number, ShopeeCategory>, id: number): string[] {
  const names: string[] = [];
  let current = categories.get(id);
  // `parent_category_id` bằng 0 là gốc; chặn 10 vòng để dữ liệu lỗi không treo script
  for (let depth = 0; current && depth < 10; depth++) {
    names.unshift(current.display_category_name || current.original_category_name);
    if (!current.parent_category_id) break;
    current = categories.get(current.parent_category_id);
  }
  return names;
}

// ── danh sách sản phẩm ───────────────────────────────────────────────

export type ItemStatus = "NORMAL" | "BANNED" | "UNLIST" | "REVIEWING" | "DELETED";

/** Mọi item_id của shop ở trạng thái cho trước (mặc định: đang bán). */
export async function getItemIds(status: ItemStatus = "NORMAL"): Promise<number[]> {
  const ids: number[] = [];
  let offset = 0;

  for (;;) {
    const page = await call<{
      item?: Array<{ item_id: number }>;
      has_next_page?: boolean;
      next_offset?: number;
    }>({
      path: "/api/v2/product/get_item_list",
      query: { offset, page_size: ITEM_LIST_PAGE, item_status: status },
    });

    ids.push(...(page.item ?? []).map((entry) => entry.item_id));
    if (!page.has_next_page) break;
    // thiếu next_offset thì tự cộng, nhưng phải tiến lên — không thì vòng lặp vô tận
    const next = page.next_offset ?? offset + ITEM_LIST_PAGE;
    if (next <= offset) break;
    offset = next;
  }
  return ids;
}

// ── thông tin chi tiết ───────────────────────────────────────────────

export type PriceInfo = {
  currency?: string;
  original_price?: number;
  current_price?: number;
};

export type StockSummary = { summary_info?: { total_available_stock?: number } };

export type ItemBaseInfo = {
  item_id: number;
  item_name: string;
  item_sku?: string;
  category_id?: number;
  description?: string;
  item_status?: string;
  has_model?: boolean;
  create_time?: number;
  update_time?: number;
  image?: { image_url_list?: string[]; image_id_list?: string[] };
  price_info?: PriceInfo[];
  stock_info_v2?: StockSummary;
  brand?: { original_brand_name?: string };
};

const chunk = <T,>(values: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size));
  return out;
};

export async function getItemBaseInfo(itemIds: number[]): Promise<ItemBaseInfo[]> {
  const items: ItemBaseInfo[] = [];
  for (const batch of chunk(itemIds, DETAIL_BATCH)) {
    const data = await call<{ item_list?: ItemBaseInfo[] }>({
      path: "/api/v2/product/get_item_base_info",
      query: { item_id_list: batch.join(","), need_complaint_policy: "false", need_tax_info: "false" },
    });
    items.push(...(data.item_list ?? []));
  }
  return items;
}

// ── phân loại và tồn kho theo từng biến thể ──────────────────────────

export type TierVariation = {
  name?: string;
  option_list?: Array<{ option?: string; image?: { image_url?: string } }>;
};

export type Model = {
  model_id: number;
  model_sku?: string;
  /** vị trí của model trong từng tier, theo đúng thứ tự của `tier_variation` */
  tier_index?: number[];
  price_info?: PriceInfo[];
  stock_info_v2?: StockSummary;
  model_status?: string;
};

export type ModelList = { tier_variation?: TierVariation[]; model?: Model[] };

/** Chỉ endpoint này mới có tồn kho thật của từng tổ hợp màu × size. */
export const getModelList = (itemId: number) =>
  call<ModelList>({ path: "/api/v2/product/get_model_list", query: { item_id: itemId } });

// ── số liệu bán hàng (để xếp "bán chạy") ─────────────────────────────

export type ItemExtraInfo = {
  item_id: number;
  sale?: number;
  views?: number;
  likes?: number;
  rating?: { rating_star?: number; rating_count?: number[] };
  comment_count?: number;
};

export async function getItemExtraInfo(itemIds: number[]): Promise<ItemExtraInfo[]> {
  const items: ItemExtraInfo[] = [];
  for (const batch of chunk(itemIds, DETAIL_BATCH)) {
    const data = await call<{ item_list?: ItemExtraInfo[] }>({
      path: "/api/v2/product/get_item_extra_info",
      query: { item_id_list: batch.join(",") },
    });
    items.push(...(data.item_list ?? []));
  }
  return items;
}
