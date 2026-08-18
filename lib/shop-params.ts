import { sortOptions, type ShopFacets, type ShopQuery, type SortValue } from "./data";

/**
 * Toàn bộ trạng thái lọc của cửa hàng nằm trong URL, nên mọi kết quả đều chia sẻ
 * được, lưu được và không mất khi tải lại trang. Đây là nơi duy nhất biết tên các
 * tham số — trang server đọc chúng, còn phần điều khiển ở client ghi lại.
 */

export const PARAM = {
  q: "q",
  category: "category",
  audience: "audience",
  size: "size",
  color: "color",
  min: "min",
  max: "max",
  sale: "sale",
  new: "new",
  stock: "stock",
  sort: "sort",
} as const;

export type RawSearchParams = Record<string, string | string[] | undefined>;

const toArray = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value : value ? [value] : []).flatMap((entry) =>
    entry.split(",").map((part) => part.trim()),
  ).filter(Boolean);

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const toNumber = (value: string | string[] | undefined) => {
  const raw = first(value);
  const parsed = Number(raw);
  return raw !== undefined && raw !== "" && Number.isFinite(parsed) ? parsed : undefined;
};

const toFlag = (value: string | string[] | undefined) => {
  const raw = first(value);
  return raw === "1" || raw === "true";
};

const isSortValue = (value: string): value is SortValue =>
  sortOptions.some((option) => option.value === value);

export function parseShopQuery(raw: RawSearchParams): ShopQuery {
  const sortRaw = first(raw[PARAM.sort]);
  const q = first(raw[PARAM.q]);

  const min = toNumber(raw[PARAM.min]);
  const max = toNumber(raw[PARAM.max]);

  return {
    q: q?.trim() || undefined,
    categories: toArray(raw[PARAM.category]),
    audiences: toArray(raw[PARAM.audience]),
    sizes: toArray(raw[PARAM.size]),
    colors: toArray(raw[PARAM.color]),
    // khoảng giá ngược đầu sẽ âm thầm không trả về gì, nên nắn lại cho hợp lệ
    minPrice: min !== undefined ? Math.max(min, 0) : undefined,
    maxPrice: max !== undefined ? Math.max(max, min ?? 0) : undefined,
    onSale: toFlag(raw[PARAM.sale]),
    isNew: toFlag(raw[PARAM.new]),
    inStock: toFlag(raw[PARAM.stock]),
    sort: sortRaw && isSortValue(sortRaw) ? sortRaw : "featured",
  };
}

/** dạng chuỗi truyền xuống client để phần điều khiển sửa được URL */
export function toQueryString(raw: RawSearchParams): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (!Object.values(PARAM).includes(key as (typeof PARAM)[keyof typeof PARAM])) continue;
    for (const entry of Array.isArray(value) ? value : value ? [value] : []) {
      if (entry !== "") params.append(key, entry);
    }
  }
  return params.toString();
}

export type ActiveFilter = { key: string; value: string; label: string };

/** danh sách phẳng những gì đang thu hẹp kết quả — dùng cho các thẻ lọc */
export function activeFilters(query: ShopQuery, bounds: ShopFacets["priceBounds"]): ActiveFilter[] {
  const chips: ActiveFilter[] = [];
  const push = (key: string, values: string[] | undefined, prefix = "") =>
    values?.forEach((value) => chips.push({ key, value, label: `${prefix}${value}` }));

  if (query.q) chips.push({ key: PARAM.q, value: query.q, label: `“${query.q}”` });
  push(PARAM.category, query.categories);
  push(PARAM.audience, query.audiences);
  push(PARAM.size, query.sizes, "Size ");
  push(PARAM.color, query.colors);

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const from = query.minPrice ?? bounds.min;
    const to = query.maxPrice ?? bounds.max;
    chips.push({ key: "price", value: "", label: `$${from} – $${to}` });
  }

  if (query.onSale) chips.push({ key: PARAM.sale, value: "1", label: "Đang giảm giá" });
  if (query.isNew) chips.push({ key: PARAM.new, value: "1", label: "Hàng mới về" });
  if (query.inStock) chips.push({ key: PARAM.stock, value: "1", label: "Còn hàng" });

  return chips;
}
