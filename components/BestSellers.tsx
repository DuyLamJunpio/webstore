"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/data";
import ProductCard from "./ProductCard";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "./icons";

type Props = { products: Product[]; filters: string[]; title: string; subtitle: string };

export default function BestSellers({
  products: bestSellers,
  filters: bestSellerFilters,
  title,
  subtitle,
}: Props) {
  const [filter, setFilter] = useState<string>("Tất cả");
  const railRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () =>
      (filter === "Tất cả" ? bestSellers : bestSellers.filter((p) => p.category === filter)).slice(
        0,
        12,
      ),
    [filter, bestSellers],
  );

  const scrollBy = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * (rail.clientWidth * 0.75), behavior: "smooth" });
  };

  return (
    <section id="best-sellers" className="section bg-surface/40 border-y border-line/60">
      <div className="shell">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <span className="eyebrow text-gold">Xu Hướng Yêu Thích</span>
            <h2 className="mt-2 font-serif text-[clamp(2rem,3.8vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.015em] text-ink">
              {title}
            </h2>
            {subtitle ? <p className="mt-2 max-w-md text-sm sm:text-base text-muted">{subtitle}</p> : null}
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Sản phẩm trước"
              className="grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-surface transition-all duration-200 hover:border-ink hover:bg-ink hover:text-cream shadow-xs"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Sản phẩm tiếp theo"
              className="grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-surface transition-all duration-200 hover:border-ink hover:bg-ink hover:text-cream shadow-xs"
            >
              <ChevronRight />
            </button>
          </div>
        </div>

        {/* ── Category filter pills ── */}
        <div className="mt-6 sm:mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none" role="tablist" aria-label="Lọc sản phẩm bán chạy">
          {bestSellerFilters.map((item) => {
            const isActive = filter === item;
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(item)}
                className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-ink text-cream shadow-xs"
                    : "border border-line-strong bg-surface text-ink/75 hover:border-ink hover:text-ink"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <div className="shell mt-8">
        <div ref={railRef} className="rail -mx-4 px-4 sm:mx-0 sm:px-0">
          {visible.map((product) => (
            <div key={product.slug} className="w-[64vw] shrink-0 sm:w-[36vw] lg:w-[268px]">
              <ProductCard
                product={product}
                sizes="(max-width: 640px) 64vw, (max-width: 1024px) 36vw, 268px"
              />
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href={filter === "Tất cả" ? "/shop" : `/shop?category=${encodeURIComponent(filter)}`}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-6 text-sm font-semibold text-ink shadow-xs transition-all duration-200 hover:border-ink hover:bg-ink hover:text-cream hover:scale-105 active:scale-95"
          >
            <span>Xem tất cả ({visible.length}+)</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

