"use client";

import type { ActiveFilter } from "@/lib/shop-params";
import { Close } from "../icons";
import { useShopUrl } from "./useShopUrl";

export default function ActiveFilters({
  queryString,
  filters,
}: {
  queryString: string;
  filters: ActiveFilter[];
}) {
  const { removeChip, clearAll } = useShopUrl(queryString);

  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <button
          key={`${filter.key}-${filter.value}`}
          type="button"
          onClick={() => removeChip(filter.key, filter.value)}
          aria-label={`Bỏ bộ lọc ${filter.label}`}
          className="inline-flex h-7 items-center gap-1.5 border border-[#d5d5d5] bg-white pl-2.5 pr-2 text-xs font-semibold text-ink transition-colors hover:border-black"
        >
          <span>{filter.label}</span>
          <Close className="h-3 w-3 text-[#777777]" />
        </button>
      ))}

      <button
        type="button"
        onClick={clearAll}
        className="h-7 px-2 text-xs font-bold uppercase tracking-wider text-[#8f633e] underline underline-offset-4 transition-colors hover:text-black"
      >
        Xoá tất cả
      </button>
    </div>
  );
}
