import Image from "next/image";
import Link from "next/link";
import { CATALOGUE_TAG } from "@/lib/catalogue";

export interface CategoryItem {
  id?: number | string;
  name: string;
  image: string | null;
  href: string;
}

export interface CategoriesProps {
  categories?: CategoryItem[];
  title?: string;
  allCategoriesHref?: string;
  allCategoriesLabel?: string;
}


function normalizeImageUrl(raw?: string | null): string | null {
  if (!raw) return null;

  const base = (process.env.WAREHOUSE_API_URL ?? "").replace(/\/$/, "");
  if (!base) return null;

  try {
    // API có thể trả URL Supabase hoàn chỉnh hoặc /storage/... trên Warehouse.
    return new URL(raw, base).href;
  } catch {
    return null;
  }
}

type ApiCategory = {
  id: number;
  name: string;
  parentId: number | null;
  count: number;
  image: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function apiCategory(value: unknown): ApiCategory | null {
  if (!isRecord(value) || typeof value.id !== "number" || typeof value.name !== "string") {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    parentId: typeof value.parent_id === "number" ? value.parent_id : null,
    count: typeof value.count === "number" ? value.count : 0,
    image: normalizeImageUrl(typeof value.image === "string" ? value.image : null),
  };
}

const categoryKey = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

const isPrintCategory = (name: string) => categoryKey(name) === "dong phuc";

/**
 * Nạp danh mục trực tiếp từ API backend (`/api/storefront/categories`).
 * Tự động đồng bộ với nhãn cache CATALOGUE_TAG khi trang quản trị cập nhật.
 * API không phản hồi hoặc trả rỗng thì ẩn khối thay vì bày danh mục cũ.
 */
export async function getStorefrontCategories(): Promise<CategoryItem[]> {
  const base = (process.env.WAREHOUSE_API_URL ?? "").replace(/\/$/, "");
  if (!base) {
    console.error("[categories] thiếu WAREHOUSE_API_URL — không nạp được danh mục");
    return [];
  }

  try {
    const response = await fetch(`${base}/api/storefront/categories`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 60, tags: [CATALOGUE_TAG] },
    });

    if (!response.ok) {
      console.error(`[categories] trang quản trị trả về HTTP ${response.status}`);
      return [];
    }

    const data: unknown = await response.json();
    const rawList: unknown[] = Array.isArray(data)
      ? data
      : isRecord(data) && Array.isArray(data.categories)
        ? data.categories
        : isRecord(data) && Array.isArray(data.data)
          ? data.data
          : [];

    if (rawList.length === 0) {
      return [];
    }

    const apiCategories = rawList
      .map(apiCategory)
      .filter((item): item is ApiCategory => item !== null);

    // Không hiển thị danh mục rỗng: bấm vào một ô trên trang chủ phải luôn có
    // sản phẩm. Với cây cha-con, giữ danh mục cha nếu chính nó hoặc một nhánh
    // con có hàng.
    const roots = apiCategories
      .filter((item) => item.parentId === null)
      .filter((item) => isPrintCategory(item.name) || item.count > 0 || apiCategories.some(
        (candidate) => candidate.parentId === item.id && candidate.count > 0,
      ));
    const displayed = roots.length > 0
      ? roots
      : apiCategories.filter((item) => item.count > 0);

    return displayed.map((item) => {
      const childNames = apiCategories
        .filter((candidate) => candidate.parentId === item.id && candidate.count > 0)
        .map((candidate) => candidate.name);
      // Giữ cả danh mục gốc: một số shop xếp hàng trực tiếp vào nhóm gốc,
      // số khác xếp vào nhóm con; cả hai đều phải ra kết quả khi khách bấm.
      const names = [item.name, ...childNames];
      const params = new URLSearchParams();
      names.forEach((name) => params.append("category", name));

      const name = item.name;

      return {
        id: item.id,
        name,
        image: item.image ?? apiCategories.find((candidate) => candidate.parentId === item.id && candidate.count > 0)?.image ?? null,
        href: isPrintCategory(name) ? "/in-ao" : `/shop?${params.toString()}`,
      };
    });
  } catch {
    console.error("[categories] không nạp được danh mục");
    return [];
  }
}

export default async function Categories({
  categories: propCategories,
  title = "Tìm theo danh mục",
  allCategoriesHref = "/shop",
  allCategoriesLabel = "XEM TẤT CẢ DANH MỤC SẢN PHẨM",
}: CategoriesProps = {}) {
  const categories =
    propCategories && propCategories.length > 0
      ? propCategories
      : await getStorefrontCategories();

  const displayCategories = categories ?? [];

  if (displayCategories.length === 0) {
    return null;
  }

  return (
    <section id="categories" className="shell section">
      <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-ink">
        {title}
      </h2>

      <div className="mt-8 sm:mt-10 grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-x-3 sm:gap-x-6 gap-y-8 sm:gap-y-10 items-start">
        {displayCategories.map((item) => (
          <Link
            key={item.id ?? item.name}
            href={item.href}
            className="group flex flex-col items-center text-center transition-transform hover:-translate-y-0.5"
          >
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={70}
                  height={70}
                  className="max-h-14 sm:max-h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <span aria-hidden="true" className="font-sans text-xl font-bold text-muted">
                  {item.name.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>

            <span className="mt-2.5 text-[11px] sm:text-xs font-semibold leading-tight text-ink transition-colors group-hover:text-[#8f633e] max-w-[140px]">
              {item.name}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10 sm:mt-14 flex justify-center">
        <Link
          href={allCategoriesHref}
          className="inline-flex h-12 w-full max-w-[460px] items-center justify-center rounded-full border border-ink bg-white px-8 text-xs sm:text-sm font-bold uppercase tracking-wider text-ink transition-all hover:bg-ink hover:text-white"
        >
          {allCategoriesLabel}
        </Link>
      </div>
    </section>
  );
}
