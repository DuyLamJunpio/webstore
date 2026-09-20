"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { HeroSlide } from "@/lib/content";
import { ArrowUpRight } from "./icons";

/**
 * Hero Banner phong cách UNIQLO LifeWear:
 * Hình học chữ nhật sắc nét, typography sans-serif đậm, mở rộng trọn vẹn 100% màn hình.
 */
export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setActive((i) => (i + 1) % slides.length), 6500);
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const current = slides[active] ?? slides[0];
  const heading = current.heading ?? slides[0].heading ?? "LifeWear: Đơn giản tạo nên sự hoàn hảo";
  const subheading =
    current.subheading ??
    slides[0].subheading ??
    "Trang phục thường ngày chất lượng cao, bền bỉ và tạo sự tự tin thoải mái tối đa cho cuộc sống của mọi người.";
  const ctaLabel = current.ctaLabel ?? slides[0].ctaLabel ?? "XEM CHI TIẾT";
  const ctaLink = current.ctaLink ?? slides[0].ctaLink ?? "/shop";

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setActive((i) => (i + 1) % slides.length);
      } else {
        setActive((i) => (i - 1 + slides.length) % slides.length);
      }
    }
    touchStartX.current = null;
  };

  return (
    <section
      id="top"
      className="relative h-screen min-h-[100dvh] h-[100dvh] w-full overflow-hidden bg-black select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-full w-full">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                i === active ? "opacity-100 scale-100" : "opacity-0 scale-102"
              } transition-transform duration-1000`}
              aria-hidden={i !== active}
            >
              {slide.mediaType === "video" ? (
                <>
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
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              )}
            </div>
          ))}

          {/* ── Top Contrast Gradient for Transparent Navbar ── */}
          <div className="absolute inset-x-0 top-0 h-36 sm:h-48 bg-gradient-to-b from-black/80 via-black/35 to-transparent pointer-events-none z-10" />

          {/* ── Minimalist Bottom Contrast Overlay ── */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none z-10" />

          {/* ── Hero Text Content ── */}
          <div className="shell absolute inset-0 z-20 flex flex-col justify-end pb-16 sm:pb-20 lg:pb-24">
            <div className="max-w-2xl text-white">
              <span className="inline-block bg-[#e60012] px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white shadow-xs">
                LIFEWEAR COLLECTION
              </span>

              {heading ? (
                <h1 className="mt-4 font-sans text-[clamp(2.2rem,5.5vw,4.5rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-white text-balance uppercase">
                  {heading}
                </h1>
              ) : null}

              {subheading ? (
                <p className="mt-3.5 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base md:text-lg font-normal">
                  {subheading}
                </p>
              ) : null}

              {ctaLabel && ctaLink ? (
                <div className="mt-6 sm:mt-8 flex items-center gap-3">
                  <Link
                    href={ctaLink}
                    className="inline-flex h-12 items-center gap-2 bg-white px-8 text-xs sm:text-sm font-bold uppercase tracking-wider text-ink shadow-md transition-all hover:bg-[#e60012] hover:text-white active:scale-98"
                  >
                    <span>{ctaLabel}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/shop?new=1"
                    className="inline-flex h-12 items-center gap-2 border border-white bg-transparent px-6 text-xs sm:text-sm font-bold uppercase tracking-wider text-white backdrop-blur-xs transition-all hover:bg-white hover:text-ink active:scale-98"
                  >
                    <span>HÀNG MỚI VỀ</span>
                  </Link>
                </div>
              ) : null}
            </div>

            {/* Slide indicators dạng thanh chữ nhật */}
            {slides.length > 1 ? (
              <div className="mt-8 flex items-center gap-2">
                {slides.map((slide, i) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`Xem ảnh ${i + 1}`}
                    aria-current={i === active}
                    className={`h-1 transition-all duration-300 ${
                      i === active ? "w-10 bg-[#e60012]" : "w-4 bg-white/40 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
    </section>
  );
}


