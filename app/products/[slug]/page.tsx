import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/product/ProductGallery";
import ProductPurchase from "@/components/product/ProductPurchase";
import StickyBuyBar from "@/components/product/StickyBuyBar";
import { promiseIcons } from "@/components/icons";
import { getCatalogue } from "@/lib/catalogue";
import { galleryOf, getProduct, inStock, promises, relatedProducts } from "@/lib/data";

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
  <span aria-hidden className="text-gold tracking-tighter">
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
    <div className="shell pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-24">
      {/* ── Sticky Buy Bar on Mobile ── */}
      {available && <StickyBuyBar product={product} />}

      {/* ── Breadcrumbs ── */}
      <nav aria-label="Đường dẫn" className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] text-muted">
        <Link href="/" className="transition-colors hover:text-ink">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/shop" className="transition-colors hover:text-ink">
          Cửa hàng
        </Link>
        <span>/</span>
        <Link
          href={`/shop?category=${encodeURIComponent(product.category)}`}
          className="transition-colors hover:text-ink"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="font-semibold text-ink truncate max-w-[200px] sm:max-w-none">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <div className="mx-auto w-full max-w-[560px] lg:mx-0 lg:sticky lg:top-[92px] lg:self-start">
          <ProductGallery
            media={galleryOf(product)}
            alt={product.name}
            badge={!available ? "Hết hàng" : product.isNew ? "Mới" : undefined}
          />
        </div>

        {/* Product Details & Purchase */}
        <div className="max-w-xl">
          <span className="eyebrow text-gold font-bold">
            {product.audience} · {product.category}
          </span>
          <h1 className="mt-2 font-serif text-[clamp(1.85rem,3.2vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-muted">
            <Stars rating={product.rating} />
            <span className="font-medium text-ink">
              {product.rating.toFixed(1)}
            </span>
            <span>·</span>
            <span>{product.reviews} đánh giá</span>
          </div>

          <p className="mt-4 text-sm sm:text-[15px] leading-relaxed text-ink/80">{product.description}</p>

          <div className="mt-6 border-t border-line pt-6">
            <ProductPurchase product={product} />
          </div>

          {/* Details & Size Guide */}
          <section id="size-guide" className="mt-8 scroll-mt-28 border-t border-line pt-6">
            <div className="flex items-baseline justify-between">
              <h2 className="eyebrow text-ink font-bold">Bảng hướng dẫn chọn size</h2>
              <span className="text-xs text-muted">Đơn vị: cm</span>
            </div>

            <div className="mt-3.5 overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
              <Image
                src="/images/size-guide.png"
                alt={`Bảng hướng dẫn chọn size — ${product.name}`}
                width={1024}
                height={704}
                className="w-full h-auto object-contain"
              />
            </div>
            <p className="mt-2 text-[11px] text-muted italic text-center">
              * Số đo có thể chênh lệch 1–2cm do đo thủ công
            </p>

            <h3 className="eyebrow text-ink/70 font-bold mt-6">Chi tiết & phom dáng</h3>
            <ul className="mt-3 flex flex-col gap-2.5">
              {product.details.map((detail) => (
                <li key={detail} className="flex gap-2.5 text-xs sm:text-sm leading-relaxed text-ink/85">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  <span>{detail}</span>
                </li>
              ))}
              <li className="flex gap-2.5 text-xs sm:text-sm leading-relaxed text-ink/85">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <span>Size có sẵn: <strong>{product.sizes.join(", ")}</strong></span>
              </li>
            </ul>
          </section>

          {/* Shopping Promises */}
          <section className="mt-8 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
            {promises.slice(0, 4).map((promise) => {
              const Icon = promiseIcons[promise.icon];
              return (
                <div key={promise.title} className="flex gap-3 rounded-xl bg-surface/60 p-3.5 ring-1 ring-line/60">
                  <Icon className="h-5 w-5 shrink-0 text-gold" />
                  <div className="text-xs leading-relaxed text-muted">
                    <span className="block font-semibold text-ink">{promise.title}</span>
                    <span>{promise.body.split(".")[0]}.</span>
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </div>

      {/* ── Related Products ── */}
      {related.length > 0 && (
        <section className="mt-16 sm:mt-20 border-t border-line pt-12 sm:pt-14">
          <div className="mb-8">
            <span className="eyebrow text-gold">Gợi Ý Cho Bạn</span>
            <h2 className="mt-1.5 font-serif text-[clamp(1.75rem,2.6vw,2.5rem)] font-medium leading-[1.05] tracking-[-0.015em] text-ink">
              Có thể bạn cũng thích
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard
                key={item.slug}
                product={item}
                sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 280px"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

