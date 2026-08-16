import Image from "next/image";
import Link from "next/link";
import { categories } from "@/lib/data";
import SectionHeading from "./SectionHeading";
import { ArrowUpRight } from "./icons";

export default function Categories() {
  return (
    <section id="categories" className="shell section">
      <SectionHeading
        title="Mua theo danh mục"
        subtitle="Ba bộ sưu tập, cùng một tiêu chuẩn về phom dáng và hoàn thiện."
      />

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.label}
            href={category.href}
            className="group relative overflow-hidden rounded-block bg-cream-dark"
          >
            <div className="relative aspect-3/4">
              <Image
                src={category.image}
                alt={category.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-900 ease-out group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            </div>

            <div className="absolute inset-x-0 bottom-0 p-6 text-cream sm:p-7">
              <p className="eyebrow text-gold-soft">{category.label}</p>
              <h3 className="mt-2 max-w-[15ch] font-serif text-[clamp(1.5rem,2vw,2rem)] font-medium leading-tight">
                {category.title}
              </h3>
              <span className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-cream px-5 text-sm font-medium text-ink transition-transform duration-300 group-hover:-translate-y-0.5">
                Mua ngay
                <ArrowUpRight />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
