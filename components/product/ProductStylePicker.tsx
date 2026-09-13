"use client";

import Image from "next/image";
import type { ProductStyle } from "@/lib/data";

export default function ProductStylePicker({
  styles,
  selected,
  onSelect,
  isSoldOut,
  className = "",
}: {
  styles: ProductStyle[];
  selected: ProductStyle;
  onSelect: (id: string) => void;
  isSoldOut: (id: string) => boolean;
  className?: string;
}) {
  // Catalogue cũ được cấp một mẫu tương thích; không để chi tiết kỹ thuật đó
  // làm giao diện hàng cũ tự nhiên mọc thêm một lựa chọn vô nghĩa.
  if (styles.length <= 1) return null;

  return (
    <div className={className}>
      <p className="eyebrow text-ink/70">
        Mẫu: <span className="font-semibold text-ink">{selected.name}</span>
      </p>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {styles.map((option) => {
          const soldOut = isSoldOut(option.id);
          const active = selected.id === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              aria-pressed={active}
              aria-label={`${option.name}${soldOut ? " — hết hàng" : ""}`}
              title={option.name}
              className={`w-24 shrink-0 rounded-card border bg-surface p-1.5 text-left transition-all ${
                active
                  ? "border-ink shadow-sm ring-1 ring-ink"
                  : "border-line-strong hover:border-ink"
              }`}
            >
              <span className="relative block aspect-square overflow-hidden rounded-[10px] bg-cream-dark">
                <Image
                  src={option.image}
                  alt={`Mẫu ${option.name}`}
                  fill
                  sizes="96px"
                  className={`object-cover transition-transform duration-300 ${
                    active ? "scale-105" : "hover:scale-105"
                  } ${soldOut ? "opacity-45 grayscale" : ""}`}
                />
                {soldOut && (
                  <span className="absolute inset-0 grid place-items-center" aria-hidden>
                    <span className="h-px w-[120%] rotate-45 bg-ink/60" />
                  </span>
                )}
              </span>
              <span className={`mt-1.5 block truncate px-0.5 text-xs font-semibold ${
                active ? "text-ink" : "text-muted"
              }`}>
                {option.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
