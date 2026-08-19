"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { HeroSlide } from "@/lib/content";
import { ArrowUpRight } from "./icons";

/**
 * Phần chạy slide của hero. Dữ liệu do `Hero.tsx` (server) lấy về rồi truyền
 * xuống — component này chỉ lo đổi slide và vẽ, không tự gọi mạng.
 */
export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    // Một slide thì không có gì để chuyển, khỏi đặt hẹn giờ chạy vô ích.
    if (slides.length < 2) return;
    const id = setInterval(() => setActive((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;

  // Chữ lấy theo slide đang hiện; slide không đặt chữ thì mượn của slide đầu,
  // để đầu trang không bị trống chữ khi chạy sang ảnh phụ.
  const current = slides[active] ?? slides[0];
  const heading = current.heading ?? slides[0].heading;
  const subheading = current.subheading ?? slides[0].subheading;
  const ctaLabel = current.ctaLabel ?? slides[0].ctaLabel;
  const ctaLink = current.ctaLink ?? slides[0].ctaLink;

  return (
    <section id="top" className="relative">
      <div className="relative h-[100vh] min-h-[640px] overflow-hidden bg-ink">
        <div className="relative h-full w-full">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1200 ease-out ${
                i === active ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={i !== active}
            >
              {slide.mediaType === "video" ? (
                <>
                  {/*
                    Video quay ngang 16:9 lên điện thoại (4:5) bị cắt hai bên rất
                    nhiều, lại tốn dung lượng mạng. Có ảnh riêng cho điện thoại
                    thì cho video ẩn hẳn ở khổ nhỏ và không preload, để máy điện
                    thoại không phải tải file video về.
                  */}
                  {slide.mobile ? (
                    <img
                      src={slide.mobile}
                      alt={slide.alt}
                      className="absolute inset-0 h-full w-full object-cover sm:hidden"
                    />
                  ) : null}
                  <video
                    src={slide.media}
                    poster={slide.poster ?? undefined}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload={i === 0 && !slide.mobile ? "auto" : "none"}
                    aria-label={slide.alt || undefined}
                    className={`absolute inset-0 h-full w-full object-cover ${
                      slide.mobile ? "hidden sm:block" : ""
                    }`}
                  />
                </>
              ) : (
                <Image
                  src={slide.media}
                  alt={slide.alt}
                  fill
                  // Ảnh đầu tiên là phần tử lớn nhất màn hình đầu, tải trước để
                  // trang không bị trống một nhịp.
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              )}
            </div>
          ))}

          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-ink/10" />

          <div className="shell absolute inset-0 flex flex-col justify-end pb-8 pt-[104px] sm:pb-12 sm:pt-[112px] lg:pb-16 lg:pt-[120px]">
            <div className="max-w-2xl text-cream">
              {heading ? (
                <h1 className="rise font-serif text-[clamp(2.75rem,7vw,6rem)] font-medium leading-[0.98] tracking-[-0.02em]">
                  {heading}
                </h1>
              ) : null}

              {subheading ? (
                <p className="rise mt-5 max-w-md text-base leading-relaxed text-cream/80 sm:text-lg">
                  {subheading}
                </p>
              ) : null}

              {ctaLabel && ctaLink ? (
                <Link
                  href={ctaLink}
                  className="rise mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-cream px-7 text-sm font-medium text-ink transition-transform duration-300 hover:-translate-y-0.5"
                >
                  {ctaLabel}
                  <ArrowUpRight />
                </Link>
              ) : null}
            </div>

            {slides.length > 1 ? (
              <div className="mt-10 flex items-end justify-between gap-6">
                <div className="flex gap-2">
                  {slides.map((slide, i) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setActive(i)}
                      aria-label={`Xem ảnh ${i + 1}`}
                      aria-current={i === active}
                      className={`h-1 rounded-full transition-all duration-500 ${
                        i === active ? "w-10 bg-gold" : "w-5 bg-cream/40 hover:bg-cream/70"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
