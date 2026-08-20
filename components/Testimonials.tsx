import Image from "next/image";
import { testimonials } from "@/lib/data";
import SectionHeading from "./SectionHeading";
import { Diamond } from "./icons";

export default function Testimonials() {
  // Chưa có đánh giá thật thì không dựng cả khối, thay vì hiện tiêu đề rỗng.
  if (testimonials.length === 0) return null;

  return (
    <section id="reviews" className="shell section">
      <SectionHeading
        align="center"
        title="Được hàng nghìn khách hàng yêu thích"
        subtitle="Lý do khách hàng quay lại: kiểu dáng không lỗi mốt, cảm giác mặc cao cấp và sự tự tin mỗi ngày."
      />

      <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((tile, i) =>
          tile.type === "quote" ? (
            <figure
              key={`q-${i}`}
              className="flex min-h-[220px] flex-col justify-between rounded-2xl bg-surface p-6 sm:p-8 ring-1 ring-line shadow-xs xl:p-10"
            >
              <Diamond className="h-2.5 w-2.5 text-gold" />
              <blockquote className="mt-4 text-base sm:text-[17px] leading-relaxed xl:text-[19px] text-ink font-normal">
                &ldquo;{tile.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-xs sm:text-sm font-medium text-muted">— {tile.author}</figcaption>
            </figure>
          ) : (
            <div
              key={`i-${i}`}
              className="relative min-h-[220px] overflow-hidden rounded-2xl bg-cream-dark"
            >
              <Image
                src={tile.src}
                alt={tile.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-top"
              />
            </div>
          ),
        )}
      </div>
    </section>
  );
}
