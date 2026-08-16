import Image from "next/image";
import { journal } from "@/lib/data";
import SectionHeading from "./SectionHeading";
import { ArrowUpRight } from "./icons";

export default function Journal() {
  return (
    <section id="journal" className="shell section">
      <SectionHeading
        title="Từ Nhật Ký"
        subtitle="Gợi ý phối đồ, xu hướng theo mùa và hướng dẫn xây dựng tủ đồ không lỗi mốt."
        action={{ label: "Xem thêm", href: "#journal" }}
      />

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {journal.map((post) => (
          <article key={post.slug} className="group flex flex-col">
            <a href={`#${post.slug}`} className="relative overflow-hidden rounded-block bg-cream-dark">
              <span className="relative block aspect-4/3">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-900 ease-out group-hover:scale-[1.04]"
                />
              </span>
            </a>

            <p className="mt-6 text-xs text-muted">{post.date}</p>
            <h3 className="mt-2 font-serif text-[24px] font-medium leading-snug">
              <a href={`#${post.slug}`}>{post.title}</a>
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted">{post.excerpt}</p>
            <a
              href={`#${post.slug}`}
              className="mt-auto inline-flex w-fit items-center gap-1.5 pt-5 text-sm font-medium"
            >
              Đọc tiếp
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
