import Image from "next/image";
import Link from "next/link";
import { getCatalogue } from "@/lib/catalogue";
import { getContent } from "@/lib/content";
import ProductCard from "./ProductCard";
import { ArrowUpRight } from "./icons";

export default async function SeasonalDrop() {
  const { products } = await getCatalogue();
  const { collection } = await getContent();

  // Chưa tạo bộ sưu tập nào bên quản trị thì ẩn hẳn khối, thay vì lấy đại vài
  // sản phẩm đầu danh sách như trước - làm vậy nó trùng y hệt khối hàng mới về.
  if (!collection) return null;

  const items = collection.productSlugs
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  // Sản phẩm trong bộ sưu tập bị xoá hoặc ngừng bán hết thì cũng không dựng khối.
  if (items.length === 0) return null;

  return (
    <section id="seasonal-drop" className="shell section">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="relative min-h-[420px] overflow-hidden rounded-block bg-ink lg:min-h-full">
          <Image
            src="/images/seasonal-drop.png"
            alt={collection.title}
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-cream sm:p-9">
            <h2 className="font-serif text-[clamp(2.25rem,3.4vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.015em]">
              {collection.title}
            </h2>
            {collection.subtitle ? (
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/80">{collection.subtitle}</p>
            ) : null}
            {collection.ctaLabel && collection.ctaLink ? (
              <Link
                href={collection.ctaLink}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-cream px-6 text-sm font-medium text-ink transition-transform duration-300 hover:-translate-y-0.5"
              >
                {collection.ctaLabel}
                <ArrowUpRight />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-9">
          {items.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 45vw, 300px"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
