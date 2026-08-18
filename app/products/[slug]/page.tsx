import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/product/ProductGallery";
import ProductPurchase from "@/components/product/ProductPurchase";
import { promiseIcons } from "@/components/icons";
import { getCatalogue } from "@/lib/catalogue";
import { galleryOf, getProduct, inStock, promises, relatedProducts } from "@/lib/data";

/**
 * Dựng sẵn trang cho hàng đang bán lúc build. Sản phẩm thêm sau vẫn mở được:
 * Next dựng trang theo yêu cầu cho slug chưa có trong danh sách này.
 */
export async function generateStaticParams() {
  const { products } = await getCatalogue();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProduct(await getCatalogue(), slug);
  if (!product) return { title: "Không tìm thấy sản phẩm" };

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.image }],
    },
  };
}

const Stars = ({ rating }: { rating: number }) => (
  <span aria-hidden className="text-gold">
    {"★★★★★".slice(0, Math.round(rating))}
    <span className="text-line-strong">{"★★★★★".slice(Math.round(rating))}</span>
  </span>
);

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const catalogue = await getCatalogue();
  const product = getProduct(catalogue, slug);
  if (!product) notFound();

  const related = relatedProducts(catalogue, product);
  const available = inStock(product);

  return (
    <div className="shell section">
      <nav aria-label="Đường dẫn" className="text-[13px] text-muted">
        <Link href="/" className="transition-colors hover:text-ink">
          Trang chủ
        </Link>
        <span className="px-2">/</span>
        <Link href="/shop" className="transition-colors hover:text-ink">
          Cửa hàng
        </Link>
        <span className="px-2">/</span>
        <Link
          href={`/shop?category=${encodeURIComponent(product.category)}`}
          className="transition-colors hover:text-ink"
        >
          {product.category}
        </Link>
        <span className="px-2">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* trần chiều rộng: trên màn hình lớn nửa lưới rộng tới ~900px, ảnh tỉ lệ
            4/5 sẽ cao hơn cả màn hình và phải cuộn mới xem hết một tấm */}
        <div className="mx-auto w-full max-w-[560px] lg:mx-0 lg:sticky lg:top-[92px] lg:self-start">
          <ProductGallery
            media={galleryOf(product)}
            alt={product.name}
            badge={!available ? "Hết hàng" : product.isNew ? "Mới" : undefined}
          />
        </div>

        <div className="max-w-xl">
          <p className="eyebrow text-gold">
            {product.audience} · {product.category}
          </p>
          <h1 className="mt-3 font-serif text-[clamp(2rem,3.2vw,3rem)] font-medium leading-[1.06] tracking-[-0.015em]">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Stars rating={product.rating} />
            <span>
              {product.rating.toFixed(1)} · {product.reviews} đánh giá
            </span>
          </div>

          <p className="mt-5 text-[15px] leading-relaxed text-muted">{product.description}</p>

          <div className="mt-6 border-t border-line pt-6">
            <ProductPurchase product={product} />
          </div>

          <section id="size-guide" className="mt-10 scroll-mt-28 border-t border-line pt-8">
            <h2 className="eyebrow text-ink/60">Chi tiết & phom dáng</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {product.details.map((detail) => (
                <li key={detail} className="flex gap-3 text-[15px] leading-relaxed">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                  {detail}
                </li>
              ))}
              <li className="flex gap-3 text-[15px] leading-relaxed">
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                Size có sẵn: {product.sizes.join(", ")}
              </li>
            </ul>
          </section>

          <section className="mt-8 grid gap-5 border-t border-line pt-8 sm:grid-cols-2">
            {promises.slice(0, 4).map((promise) => {
              const Icon = promiseIcons[promise.icon];
              return (
                <div key={promise.title} className="flex gap-3">
                  <Icon className="h-5 w-5 shrink-0 text-gold" />
                  <p className="text-[13px] leading-relaxed text-muted">
                    <span className="block font-medium text-ink">{promise.title}</span>
                    {promise.body.split(".")[0]}.
                  </p>
                </div>
              );
            })}
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t border-line pt-14">
          <h2 className="font-serif text-[clamp(1.75rem,2.6vw,2.5rem)] font-medium leading-[1.05] tracking-[-0.015em]">
            Có thể bạn cũng thích
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard
                key={item.slug}
                product={item}
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 300px"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
