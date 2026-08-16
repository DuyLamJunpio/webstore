import Image from "next/image";
import { testimonials } from "@/lib/data";
import SectionHeading from "./SectionHeading";
import { Diamond } from "./icons";

export default function Testimonials() {
  return (
    <section id="reviews" className="shell section">
      <SectionHeading
        align="center"
        title="Được hàng nghìn khách hàng yêu thích"
        subtitle="Lý do khách hàng quay lại: kiểu dáng không lỗi mốt, cảm giác mặc cao cấp và sự tự tin mỗi ngày."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((tile, i) =>
          tile.type === "quote" ? (
            <figure
              key={`q-${i}`}
              className="flex min-h-[240px] flex-col justify-between rounded-block bg-surface p-8 ring-1 ring-line xl:p-10"
            >
              <Diamond className="h-2.5 w-2.5 text-gold" />
              <blockquote className="mt-6 text-[17px] leading-relaxed xl:text-[19px]">
                &ldquo;{tile.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 text-sm text-muted">— {tile.author}</figcaption>
            </figure>
          ) : (
            <div
              key={`i-${i}`}
              className="relative min-h-[240px] overflow-hidden rounded-block bg-cream-dark"
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
