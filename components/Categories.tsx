import Image from "next/image";
import Link from "next/link";
import { getCatalogue } from "@/lib/catalogue";
import { getContent, heading } from "@/lib/content";
import SectionHeading from "./SectionHeading";
import { ArrowUpRight } from "./icons";

export default async function Categories() {
  const { tiles } = await getCatalogue();
  const content = await getContent();

  if (tiles.length === 0) return null;

  return (
    <section id="categories" className="shell section">
      <SectionHeading
        title={heading(content, "categories.title", "Mua Theo Danh Mục")}
        subtitle="Khám phá các bộ sưu tập thiết kế tối giản, chất liệu cao cấp cho mọi dịp."
      />

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {tiles.map((category) => (
          <Link
            key={category.title}
            href={category.href}
            className="group relative overflow-hidden rounded-block bg-cream-dark shadow-sm transition-all duration-300 hover:shadow-xl"
          >
            <div className="relative aspect-[4/5] sm:aspect-3/4 overflow-hidden">
              <Image
                src={category.image}
                alt={category.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
            </div>

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7 text-cream">
              <p className="eyebrow text-gold-soft">{category.label}</p>
              <h3 className="mt-2 font-serif text-[clamp(1.5rem,2.2vw,2rem)] font-medium leading-tight text-cream">
                {category.title}
              </h3>
              <div className="mt-4 flex items-center">
                <span className="inline-flex h-10 items-center gap-2 rounded-full bg-cream/95 px-5 text-xs sm:text-sm font-semibold text-ink shadow-md backdrop-blur-md transition-transform duration-200 group-hover:scale-105">
                  <span>Khám phá ngay</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

