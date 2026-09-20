import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ActiveFilters from "@/components/shop/ActiveFilters";
import ShopFilters from "@/components/shop/ShopFilters";
import ShopToolbar from "@/components/shop/ShopToolbar";
import { getCatalogue } from "@/lib/catalogue";
import { facetCounts, filterProducts } from "@/lib/data";
import { activeFilters, parseShopQuery, toQueryString } from "@/lib/shop-params";

export const metadata: Metadata = {
  title: "Cửa hàng",
  description:
    "Toàn bộ sản phẩm TBC ở một nơi — lọc theo danh mục, size, màu sắc và giá, hoặc tìm kiếm trong cả danh mục.",
};

export default async function ShopPage(props: PageProps<"/shop">) {
  const raw = await props.searchParams;
  const query = parseShopQuery(raw);
  const queryString = toQueryString(raw);

  const catalogue = await getCatalogue();
  const results = filterProducts(catalogue, query);
  const counts = facetCounts(catalogue, query);
  const chips = activeFilters(query, catalogue.facets.priceBounds);
  const singleCategory = query.categories && query.categories.length === 1 ? query.categories[0] : undefined;

  const pageTitle = query.q
    ? `Kết quả cho “${query.q}”`
    : singleCategory
      ? singleCategory
      : query.isNew
        ? "Hàng Mới Về"
        : query.onSale
          ? "Sản Phẩm Đang Ưu Đãi"
          : "Tất Cả Sản Phẩm";

  const pageDescription = query.isNew
    ? "Khám phá các thiết kế mới nhất vừa cập bến — kiểu dáng hiện đại, phom dáng chuẩn cùng chất liệu cao cấp cho vẻ ngoài tự tin mỗi ngày."
    : query.onSale
      ? "Những sản phẩm chất lượng với mức giá ưu đãi đặc biệt. Số lượng có hạn."
      : "Những món đồ cơ bản chất lượng cao cho nam, nữ và trẻ em. Lựa chọn màu sắc, kích cỡ và phom dáng yêu thích của bạn.";

  return (
    <div className="shell pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-24">
      {/* ── Breadcrumbs ── */}
      <nav aria-label="Đường dẫn" className="flex items-center gap-2 text-xs sm:text-[13px] text-muted">
        <Link href="/" className="transition-colors hover:text-ink">
          Trang chủ
        </Link>
        <span>/</span>
        {query.isNew || query.onSale || singleCategory ? (
          <>
            <Link href="/shop" className="transition-colors hover:text-ink">
              Cửa hàng
            </Link>
            <span>/</span>
            <span className="font-semibold text-ink">
              {singleCategory || (query.isNew ? "Hàng mới về" : "Ưu đãi")}
            </span>
          </>
        ) : (
          <span className="font-semibold text-ink">Cửa hàng</span>
        )}
      </nav>

      <header className="mt-4 max-w-2xl">
        <h1 className="font-sans text-[clamp(2rem,3.8vw,3.25rem)] font-black uppercase leading-[1.05] tracking-tight text-ink">
          {pageTitle}
        </h1>
        <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[#666666]">
          {pageDescription}
        </p>
      </header>

      {/* ── Toolbar: Search & Sort ── */}
      <div className="mt-7">
        <ShopToolbar queryString={queryString} total={results.length} />
      </div>

      <div className="mt-7 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10">
        <ShopFilters
          queryString={queryString}
          counts={counts}
          facets={catalogue.facets}
          activeCount={chips.length}
        />

        <div className="min-w-0">
          <ActiveFilters queryString={queryString} filters={chips} />

          {results.length > 0 ? (
            <div
              className={`grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4 ${
                chips.length > 0 ? "mt-6" : ""
              }`}
            >
              {results.map((product) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                  sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 280px"
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 border border-line bg-white px-6 py-16 text-center shadow-xs">
              <p className="font-sans text-xl sm:text-2xl font-black uppercase text-ink">
                Không tìm thấy sản phẩm phù hợp
              </p>
              <p className="measure mt-3 text-xs sm:text-sm leading-relaxed text-[#666666]">
                Thử bỏ bớt bộ lọc đã chọn, nới rộng khoảng giá hoặc tìm kiếm với từ khoá khác.
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-flex h-11 items-center bg-black px-7 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#8f633e]"
              >
                Đặt lại toàn bộ bộ lọc
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

