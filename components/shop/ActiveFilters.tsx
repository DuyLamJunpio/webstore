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
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-strong bg-surface pl-3.5 pr-2.5 text-[13px] transition-colors hover:border-ink"
        >
          {filter.label}
          <Close className="h-3.5 w-3.5 text-muted" />
        </button>
      ))}

      <button
        type="button"
        onClick={clearAll}
        className="h-8 px-2 text-[13px] text-muted underline underline-offset-4 transition-colors hover:text-ink"
      >
        Xoá tất cả
      </button>
    </div>
  );
}
