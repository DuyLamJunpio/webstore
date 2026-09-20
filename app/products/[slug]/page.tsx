import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/product/ProductGallery";
import ProductPurchase from "@/components/product/ProductPurchase";
import StickyBuyBar from "@/components/product/StickyBuyBar";
import VariantSelectionProvider from "@/components/product/VariantSelectionProvider";
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
  <span aria-hidden className="text-[#e60012] tracking-tighter">
    {"★★★★★".slice(0, Math.round(rating))}
    <span className="text-[#cccccc]">{"★★★★★".slice(Math.round(rating))}</span>
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
      <VariantSelectionProvider key={product.slug} product={product}>
      {/* ── Sticky Buy Bar on Mobile ── */}
      {available && <StickyBuyBar />}

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
          <span className="inline-block bg-[#e60012] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-2xs">
            {product.audience} · {product.category}
          </span>
          <h1 className="mt-3 font-sans text-[clamp(1.75rem,3.2vw,2.5rem)] font-black uppercase leading-[1.08] tracking-tight text-ink">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-muted">
            <Stars rating={product.rating} />
            <span className="font-bold text-ink">
              {product.rating.toFixed(1)}
            </span>
            <span>·</span>
            <span>{product.reviews} đánh giá</span>
          </div>

          <p className="mt-4 text-xs sm:text-sm leading-relaxed text-[#555555]">{product.description}</p>

          <div className="mt-6 border-t border-[#e5e5e5] pt-6">
            <ProductPurchase product={product} />
          </div>

          {/* Details & Size Guide */}
          <section id="size-guide" className="mt-8 scroll-mt-28 border-t border-[#e5e5e5] pt-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-ink">BẢNG THÔNG SỐ KÍCH THƯỚC</h2>
              <span className="text-xs text-[#777777]">Đơn vị: cm</span>
            </div>

            <div className="mt-3.5 overflow-hidden border border-[#e5e5e5] bg-white shadow-xs">
              <Image
                src="/images/size-guide.png"
                alt={`Bảng hướng dẫn chọn size — ${product.name}`}
                width={1024}
                height={704}
                className="w-full h-auto object-contain"
              />
            </div>
            <p className="mt-2 text-[11px] text-[#777777] italic text-center">
              * Số đo có thể chênh lệch 1–2cm do đo thủ công
            </p>

            <h3 className="text-xs font-black uppercase tracking-wider text-ink mt-6">CHI TIẾT & CHẤT LIỆU</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {product.details.map((detail) => (
                <li key={detail} className="flex gap-2.5 text-xs sm:text-sm leading-relaxed text-[#444444]">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[#e60012]" />
                  <span>{detail}</span>
                </li>
              ))}
              <li className="flex gap-2.5 text-xs sm:text-sm leading-relaxed text-[#444444]">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[#e60012]" />
                <span>Kích cỡ có sẵn: <strong>{product.sizes.join(", ")}</strong></span>
              </li>
            </ul>
          </section>

          {/* Shopping Promises */}
          <section className="mt-8 grid gap-3 border-t border-[#e5e5e5] pt-6 sm:grid-cols-2">
            {promises.slice(0, 4).map((promise) => {
              const Icon = promiseIcons[promise.icon];
              return (
                <div key={promise.title} className="flex gap-3 border border-[#e5e5e5] bg-[#f7f7f7] p-3.5">
                  <Icon className="h-4 w-4 shrink-0 text-[#e60012]" />
                  <div className="text-xs leading-relaxed text-[#666666]">
                    <span className="block font-bold uppercase tracking-wide text-ink">{promise.title}</span>
                    <span>{promise.body.split(".")[0]}.</span>
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </div>
      </VariantSelectionProvider>

      {/* ── Related Products ── */}
      {related.length > 0 && (
        <section className="mt-16 sm:mt-20 border-t border-[#e5e5e5] pt-12 sm:pt-14">
          <div className="mb-8">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#e60012]">GỢI Ý LIFEWEAR</span>
            <h2 className="mt-1.5 font-sans text-[clamp(1.5rem,2.4vw,2.25rem)] font-black uppercase leading-[1.05] tracking-tight text-ink">
              CÓ THỂ BẠN CŨNG THÍCH
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
