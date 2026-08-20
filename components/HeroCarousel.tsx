"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { HeroSlide } from "@/lib/content";
import { ArrowUpRight } from "./icons";

/**
 * Phần chạy slide của hero.
 * Hỗ trợ cảm ứng vuốt (touch swipe), tự động chuyển slide và tương thích dvh trên di động.
 */
export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setActive((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const current = slides[active] ?? slides[0];
  const heading = current.heading ?? slides[0].heading;
  const subheading = current.subheading ?? slides[0].subheading;
  const ctaLabel = current.ctaLabel ?? slides[0].ctaLabel;
  const ctaLink = current.ctaLink ?? slides[0].ctaLink;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Vuốt sang trái -> slide tiếp theo
        setActive((i) => (i + 1) % slides.length);
      } else {
        // Vuốt sang phải -> slide trước
        setActive((i) => (i - 1 + slides.length) % slides.length);
      }
    }
    touchStartX.current = null;
  };

  return (
    <section
      id="top"
      className="relative select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-[82dvh] min-h-[480px] sm:h-[100dvh] sm:min-h-[640px] overflow-hidden bg-ink">
        <div className="relative h-full w-full">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
                i === active ? "opacity-100 scale-100" : "opacity-0 scale-105"
              } transition-transform duration-1500`}
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

          {/* ── Gradient Overlay ── */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/20" />

          {/* ── Content ── */}
          <div className="shell absolute inset-0 flex flex-col justify-end pb-12 pt-[100px] sm:pb-14 sm:pt-[110px] lg:pb-18 lg:pt-[120px]">
            <div className="max-w-2xl text-cream">
              <span className="rise inline-flex items-center gap-2 rounded-full border border-cream/20 bg-ink/40 px-3.5 py-1 text-[11px] font-semibold tracking-wider uppercase text-gold-soft backdrop-blur-md">
                Bộ Sưu Tập Mới
              </span>

              {heading ? (
                <h1 className="rise mt-4 font-serif text-[clamp(2.5rem,6.5vw,5.5rem)] font-medium leading-[1.02] tracking-[-0.02em] text-cream text-balance">
                  {heading}
                </h1>
              ) : null}

              {subheading ? (
                <p className="rise mt-4 max-w-lg text-sm leading-relaxed text-cream/80 sm:text-base md:text-lg">
                  {subheading}
                </p>
              ) : null}

              {ctaLabel && ctaLink ? (
                <div className="rise mt-7 flex items-center gap-4">
                  <Link
                    href={ctaLink}
                    className="inline-flex h-12 items-center gap-2.5 rounded-full bg-cream px-7 text-sm font-semibold text-ink shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
                  >
                    <span>{ctaLabel}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : null}
            </div>

            {slides.length > 1 ? (
              <div className="mt-10 flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  {slides.map((slide, i) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setActive(i)}
                      aria-label={`Xem ảnh ${i + 1}`}
                      aria-current={i === active}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        i === active ? "w-10 bg-gold" : "w-4 bg-cream/35 hover:bg-cream/70"
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

