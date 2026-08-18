"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/data";
import ProductCard from "./ProductCard";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "./icons";

type Props = { products: Product[]; filters: string[] };

export default function BestSellers({ products: bestSellers, filters: bestSellerFilters }: Props) {
  const [filter, setFilter] = useState<string>("Tất cả");
  const railRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () =>
      (filter === "Tất cả" ? bestSellers : bestSellers.filter((p) => p.category === filter))
        // dãy ngang chỉ cuộn được chừng này là hết kiên nhẫn; "Xem thêm" dẫn sang /shop
        .slice(0, 12),
    [filter, bestSellers],
  );

  const scrollBy = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * (rail.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section id="best-sellers" className="section">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-serif text-[clamp(2.25rem,4vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.015em]">
            Bán chạy nhất
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Sản phẩm trước"
              className="grid h-10 w-10 place-items-center rounded-full border border-line-strong transition-colors hover:border-ink hover:bg-ink hover:text-cream"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Sản phẩm tiếp theo"
              className="grid h-10 w-10 place-items-center rounded-full border border-line-strong transition-colors hover:border-ink hover:bg-ink hover:text-cream"
            >
              <ChevronRight />
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Lọc sản phẩm bán chạy">
          {bestSellerFilters.map((item) => {
            const isActive = filter === item;
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(item)}
                className={`h-9 rounded-full px-4 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-ink text-cream"
                    : "border border-line-strong text-ink/70 hover:border-ink hover:text-ink"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <div className="shell mt-10">
        <div ref={railRef} className="rail">
          {visible.map((product) => (
            <div key={product.slug} className="w-[62vw] shrink-0 sm:w-[38vw] lg:w-[262px]">
              <ProductCard product={product} sizes="(max-width: 640px) 62vw, (max-width: 1024px) 38vw, 262px" />
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href={filter === "Tất cả" ? "/shop" : `/shop?category=${encodeURIComponent(filter)}`}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong px-6 text-sm font-medium transition-colors hover:border-ink hover:bg-ink hover:text-cream"
          >
            Xem thêm
            <ArrowUpRight />
          </Link>
        </div>
      </div>
    </section>
  );
}
