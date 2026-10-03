"use client";

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
  const blocks = current.contentBlocks.length
    ? current.contentBlocks
    : [{ title: current.heading ?? "LifeWear: Đơn giản tạo nên sự hoàn hảo", content: current.subheading ?? "Trang phục thường ngày chất lượng cao, bền bỉ và tạo sự tự tin thoải mái." }];
  const ctas = current.ctas.length
    ? current.ctas
    : current.ctaLabel && current.ctaLink ? [{ label: current.ctaLabel, link: current.ctaLink, style: "primary" as const, newTab: false }] : [];

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
      className="relative h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-black select-none"
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
              <HeroMedia src={slide.media} type={slide.mediaType} poster={slide.poster} alt={slide.alt} focalPoint={slide.desktopLayout.focalPoint} className="hidden sm:block" preload={i === 0} />
              <HeroMedia src={slide.mobile ?? slide.media} type={slide.mobile ? slide.mobileMediaType : slide.mediaType} poster={slide.poster} alt={slide.alt} focalPoint={slide.mobileLayout.focalPoint} className="sm:hidden" preload={i === 0} />
            </div>
          ))}

          {/* ── Top Contrast Gradient for Transparent Navbar ── */}
          <div className="absolute inset-x-0 top-0 h-36 sm:h-48 bg-gradient-to-b from-black/80 via-black/35 to-transparent pointer-events-none z-10" />

          {/* ── Minimalist Bottom Contrast Overlay ── */}
          <div className="absolute inset-0 z-10 hidden pointer-events-none sm:block" style={{ backgroundColor: `rgb(0 0 0 / ${current.desktopLayout.overlayOpacity / 100})` }} />
          <div className="absolute inset-0 z-10 pointer-events-none sm:hidden" style={{ backgroundColor: `rgb(0 0 0 / ${current.mobileLayout.overlayOpacity / 100})` }} />

          {/* ── Hero Text Content ── */}
          <HeroContent blocks={blocks} ctas={ctas} desktop={current.desktopLayout} mobile={current.mobileLayout} />

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
                      i === active ? "w-10 bg-[#8f633e]" : "w-4 bg-white/40 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
    </section>
  );
}

function HeroMedia({ src, type, poster, alt, focalPoint, className, preload }: { src: string; type: "image" | "video"; poster: string | null; alt: string; focalPoint: string; className: string; preload: boolean }) {
  const style = { objectPosition: focalPoint.replace("-", " ") };
  return type === "video" ? <video src={src} poster={poster ?? undefined} autoPlay muted loop playsInline preload={preload ? "auto" : "metadata"} aria-label={alt || undefined} className={`absolute inset-0 h-full w-full object-cover ${className}`} style={style} /> : <img src={src} alt={alt} fetchPriority={preload ? "high" : "auto"} className={`absolute inset-0 h-full w-full object-cover ${className}`} style={style} />;
}

function HeroContent({ blocks, ctas, desktop, mobile }: { blocks: { title: string; content: string }[]; ctas: { label: string; link: string; style: "primary" | "secondary" | "ghost"; newTab: boolean }[]; desktop: HeroSlide["desktopLayout"]; mobile: HeroSlide["mobileLayout"] }) {
  const position = (layout: HeroSlide["desktopLayout"]) => `${layout.vertical === "top" ? "justify-start" : layout.vertical === "bottom" ? "justify-end" : "justify-center"} ${layout.horizontal === "left" ? "items-start" : layout.horizontal === "right" ? "items-end" : "items-center"}`;
  const content = <div className="max-w-2xl text-white"><div className="space-y-3">{blocks.map((block, index) => <div key={`${block.title}-${index}`}>{block.title ? index === 0 ? <h1 className="font-sans text-[clamp(2.2rem,5.5vw,4.5rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-balance uppercase">{block.title}</h1> : <h2 className="text-xl font-bold uppercase sm:text-2xl">{block.title}</h2> : null}{block.content ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base md:text-lg">{block.content}</p> : null}</div>)}</div>{ctas.length ? <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">{ctas.filter((cta) => cta.label && cta.link).map((cta, index) => <Link key={`${cta.label}-${cta.link}`} href={cta.link} target={cta.newTab ? "_blank" : undefined} rel={cta.newTab ? "noreferrer" : undefined} className={`inline-flex h-11 items-center gap-2 px-6 text-xs font-bold uppercase tracking-wider transition-all active:scale-98 sm:h-12 sm:w-auto sm:px-8 sm:text-sm ${index >= 2 ? "w-full justify-center" : ""} ${cta.style === "secondary" ? "bg-[#8f633e] text-white hover:bg-[#734d2c]" : cta.style === "ghost" ? "border border-white bg-transparent text-white hover:bg-white hover:text-ink" : "bg-white text-ink hover:bg-[#8f633e] hover:text-white"}`}><span>{cta.label}</span><ArrowUpRight className="h-4 w-4" /></Link>)}</div> : null}</div>;
  return <><div className={`shell absolute inset-0 z-20 hidden flex-col py-16 sm:flex sm:py-20 lg:py-24 ${position(desktop)}`} style={{ textAlign: desktop.textAlign }}>{content}</div><div className={`shell absolute inset-0 z-20 flex flex-col px-6 py-16 sm:hidden ${position(mobile)}`} style={{ textAlign: mobile.textAlign }}>{content}</div></>;
}


