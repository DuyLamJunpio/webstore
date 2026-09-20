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
    <section id="best-sellers" className="section bg-[#f7f7f7] border-y border-line">
      <div className="shell">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-line pb-4">
          <div>
            <span className="inline-block bg-[#8f633e] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-2xs">
              BÁN CHẠY NHẤT
            </span>
            <h2 className="mt-2 font-sans text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold leading-[1.1] tracking-[-0.01em] uppercase text-ink">
              {title}
            </h2>
            {subtitle ? <p className="mt-2 max-w-md text-sm text-[#666666]">{subtitle}</p> : null}
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Sản phẩm trước"
              className="grid h-9 w-9 place-items-center border border-line-strong bg-white text-ink transition-colors hover:bg-black hover:text-white"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Sản phẩm tiếp theo"
              className="grid h-9 w-9 place-items-center border border-line-strong bg-white text-ink transition-colors hover:bg-black hover:text-white"
            >
              <ChevronRight />
            </button>
          </div>
        </div>

        {/* ── Category filter pills ── */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none" role="tablist" aria-label="Lọc sản phẩm bán chạy">
          {bestSellerFilters.map((item) => {
            const isActive = filter === item;
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(item)}
                className={`h-9 shrink-0 px-4 text-xs font-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-[#8f633e] text-white shadow-xs"
                    : "border border-line-strong bg-white text-ink hover:border-black"
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
            className="inline-flex h-11 items-center gap-2 border-2 border-black bg-white px-8 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-black hover:text-white"
          >
            <span>XEM TẤT CẢ SẢN PHẨM ({visible.length}+)</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

