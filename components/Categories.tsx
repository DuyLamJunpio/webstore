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
        title={heading(content, "categories.title", "DANH MỤC NỔI BẬT")}
        subtitle="Khám phá các dòng sản phẩm cơ bản chất lượng cao, bền bỉ cho mọi hoạt động hàng ngày."
      />

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {tiles.map((category) => (
          <Link
            key={category.title}
            href={category.href}
            className="group relative block overflow-hidden bg-white border border-[#e5e5e5] transition-all hover:border-black/50"
          >
            <div className="relative aspect-square overflow-hidden bg-[#f4f4f4]">
              <Image
                src={category.image}
                alt={category.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>

            <div className="p-3 sm:p-4 bg-white border-t border-line flex items-center justify-between">
              <div>
                <h3 className="font-sans text-xs sm:text-sm font-bold uppercase tracking-wider text-ink group-hover:text-[#e60012] transition-colors">
                  {category.title}
                </h3>
                <p className="text-[11px] text-muted mt-0.5">{category.label}</p>
              </div>
              <span className="text-xs font-bold uppercase text-ink underline underline-offset-2 group-hover:text-[#e60012]">
                XEM
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

