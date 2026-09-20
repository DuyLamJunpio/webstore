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
        eyebrow="Ý KIẾN KHÁCH HÀNG"
        title="ĐƯỢC HÀNG NGHÌN KHÁCH HÀNG TIN CHỌN"
        subtitle="Trải nghiệm trang phục tối giản, chất lượng cao cấp và cảm giác thoải mái trọn vẹn mỗi ngày từ khách hàng thực tế."
      />

      <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((tile, i) =>
          tile.type === "quote" ? (
            <figure
              key={`q-${i}`}
              className="flex min-h-[220px] flex-col justify-between border border-line bg-white p-6 sm:p-8 shadow-xs"
            >
              <div className="flex items-center gap-1 text-[#8f633e] text-xs font-black tracking-widest">
                <span>★★★★★</span>
                <span className="ml-2 text-[10px] text-muted font-bold uppercase tracking-wider">ĐÁNH GIÁ 5 SAO</span>
              </div>
              <blockquote className="mt-4 text-sm sm:text-base leading-relaxed text-ink font-normal">
                &ldquo;{tile.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 border-t border-[#f0f0f0] pt-3 text-xs font-bold uppercase tracking-wider text-muted">
                — {tile.author}
              </figcaption>
            </figure>
          ) : (
            <div
              key={`i-${i}`}
              className="relative min-h-[220px] overflow-hidden border border-line bg-[#f7f7f7]"
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
