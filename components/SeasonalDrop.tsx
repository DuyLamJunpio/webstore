import Image from "next/image";
import Link from "next/link";
import { getCatalogue } from "@/lib/catalogue";
import { getContent } from "@/lib/content";
import ProductCard from "./ProductCard";
import { ArrowUpRight } from "./icons";

export default async function SeasonalDrop() {
  const { products } = await getCatalogue();
  const { collections } = await getContent();

  const sections = collections
    .map((collection) => ({
      collection,
      items: collection.productSlugs
        .map((slug) => products.find((p) => p.slug === slug))
        .filter((p): p is NonNullable<typeof p> => p !== undefined),
    }))
    .filter(({ items }) => items.length > 0);

  if (sections.length === 0) return null;

  return (
    <>
      {sections.map(({ collection, items }, index) => (
        <section
          key={collection.id}
          id={index === 0 ? "seasonal-drop" : `seasonal-drop-${collection.id}`}
          className="shell section"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="relative min-h-[380px] sm:min-h-[460px] overflow-hidden rounded-block bg-ink shadow-md lg:min-h-full">
              <Image
                src={collection.imageUrl ?? "/images/seasonal-drop.png"}
                alt={collection.title}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9 text-cream">
                <span className="eyebrow text-gold-soft">Bộ Sưu Tập Giới Hạn</span>
                <h2 className="mt-2 font-serif text-[clamp(2rem,3.2vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.015em]">
                  {collection.title}
                </h2>
                {collection.subtitle ? (
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/80">{collection.subtitle}</p>
                ) : null}
                {collection.ctaLabel && collection.ctaLink ? (
                  <Link
                    href={collection.ctaLink}
                    className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-cream px-6 text-sm font-semibold text-ink shadow-md transition-transform duration-200 hover:scale-105 active:scale-95"
                  >
                    <span>{collection.ctaLabel}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-9">
              {items.map((product) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                  sizes="(max-width: 640px) 48vw, (max-width: 1024px) 45vw, 300px"
                />
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}

