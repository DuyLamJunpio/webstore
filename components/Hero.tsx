"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "./icons";

const slides = [
  { src: "/images/hero-1.png", alt: "Người mẫu mặc áo khoác phối khối màu của mùa mới" },
  { src: "/images/hero-2.png", alt: "Người mẫu mặc áo khoác da lúc hoàng hôn" },
];

export default function Hero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="top">
      <div className="relative overflow-hidden bg-ink">
        <div className="relative aspect-4/5 w-full sm:aspect-16/11 lg:aspect-16/7">
          {slides.map((slide, i) => (
            <Image
              key={slide.src}
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              className={`object-cover transition-opacity duration-1200 ease-out ${
                i === active ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}

          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-ink/10" />

          <div className="shell absolute inset-0 flex flex-col justify-end py-8 sm:py-12 lg:py-16">
            <div className="max-w-2xl text-cream">
              <h1 className="rise font-serif text-[clamp(2.75rem,7vw,6rem)] font-medium leading-[0.98] tracking-[-0.02em]">
                Phong Cách Chuyển Động
              </h1>
              <p className="rise mt-5 max-w-md text-base leading-relaxed text-cream/80 sm:text-lg">
                Những món đồ mùa mới cho sự tự tin mỗi ngày.
              </p>
              <Link
                href="/shop"
                className="rise mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-cream px-7 text-sm font-medium text-ink transition-transform duration-300 hover:-translate-y-0.5"
              >
                Mua ngay
                <ArrowUpRight />
              </Link>
            </div>

            <div className="mt-10 flex items-end justify-between gap-6">
              <div className="flex gap-2">
                {slides.map((slide, i) => (
                  <button
                    key={slide.src}
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

              <Link
                href="/shop?category=T-Shirt"
                className="group hidden w-[268px] items-center gap-4 rounded-2xl bg-cream/95 p-3 backdrop-blur transition-transform duration-300 hover:-translate-y-1 sm:flex"
              >
                <span className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl bg-cream-dark">
                  <Image
                    src="/images/hero-card-tshirt.png"
                    alt="Áo thun oversize in hình"
                    fill
                    sizes="68px"
                    className="object-cover"
                  />
                </span>
                <span className="flex flex-1 flex-col gap-1">
                  <span className="text-[15px] font-medium leading-none">Áo thun bán chạy</span>
                  <span className="flex items-center gap-1 text-[13px] text-muted">
                    Mua ngay
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
