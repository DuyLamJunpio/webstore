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

  return (
    <div className="shell section">
      <nav aria-label="Đường dẫn" className="text-[13px] text-muted">
        <Link href="/" className="transition-colors hover:text-ink">
          Trang chủ
        </Link>
        <span className="px-2">/</span>
        <span className="text-ink">Cửa hàng</span>
      </nav>

      <header className="mt-4 max-w-2xl">
        <h1 className="font-serif text-[clamp(2.25rem,4vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.015em]">
          {query.q ? `Kết quả cho “${query.q}”` : "Tất Cả Sản Phẩm"}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Đồ cơ bản được chọn lọc cho nam, nữ và trẻ em. Lọc theo size, màu sắc hay giá — mọi lựa
          chọn đều được giữ trên thanh địa chỉ, nên bạn chia sẻ được đúng thứ mình đang xem.
        </p>
      </header>

      <div className="mt-8">
        <ShopToolbar queryString={queryString} total={results.length} />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        <ShopFilters
          queryString={queryString}
          counts={counts}
          facets={catalogue.facets}
          activeCount={chips.length}
        />

        <div>
          <ActiveFilters queryString={queryString} filters={chips} />

          {results.length > 0 ? (
            <div
              className={`grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 2xl:grid-cols-4 ${
                chips.length > 0 ? "mt-8" : ""
              }`}
            >
              {results.map((product) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 300px"
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-block border border-line bg-surface px-6 py-20 text-center">
              <p className="font-serif text-2xl font-medium">
                Không có sản phẩm nào khớp với bộ lọc
              </p>
              <p className="measure mt-3 text-[15px] leading-relaxed text-muted">
                Thử bỏ bớt một bộ lọc, nới rộng khoảng giá, hoặc tìm bằng từ khoá chung hơn như
                “hoodie” hay “áo khoác”.
              </p>
              <Link
                href="/shop"
                className="mt-7 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-cream transition-opacity hover:opacity-90"
              >
                Đặt lại toàn bộ
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
