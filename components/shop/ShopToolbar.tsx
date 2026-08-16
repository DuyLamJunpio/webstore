"use client";

import { useEffect, useState } from "react";
import { sortOptions } from "@/lib/data";
import { PARAM } from "@/lib/shop-params";
import { Close, Search } from "../icons";
import { useShopUrl } from "./useShopUrl";

export default function ShopToolbar({
  queryString,
  total,
}: {
  queryString: string;
  total: number;
}) {
  const { params, pending, set } = useShopUrl(queryString);
  const urlQuery = params.get(PARAM.q) ?? "";
  const [text, setText] = useState(urlQuery);
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);

  // từ khoá đổi ở chỗ khác (thẻ lọc, "Xoá tất cả", nút Back): nhận lại luôn mà
  // không cần effect, để ô nhập không giằng co với URL
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setText(urlQuery);
  }

  // trì hoãn một nhịp để mỗi phím gõ không đẩy một URL mới
  useEffect(() => {
    if (text === urlQuery) return;
    const timer = setTimeout(() => set(PARAM.q, text.trim() || null), 350);
    return () => clearTimeout(timer);
  }, [text, urlQuery, set]);

  return (
    <div className="flex flex-col gap-4 border-y border-line py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex h-11 flex-1 items-center gap-3 rounded-full border border-line-strong bg-surface px-4 md:max-w-md">
        <Search className="h-[18px] w-[18px] shrink-0 text-muted" />
        <input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Tìm áo hoodie, áo khoác, quần jeans…"
          aria-label="Tìm kiếm sản phẩm"
          className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted/70 [&::-webkit-search-cancel-button]:hidden"
        />
        {text && (
          <button
            type="button"
            onClick={() => setText("")}
            aria-label="Xoá từ khoá"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <Close className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 md:justify-end">
        <p aria-live="polite" className={`text-sm text-muted ${pending ? "opacity-50" : ""}`}>
          {total} sản phẩm
        </p>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Sắp xếp</span>
          <select
            value={params.get(PARAM.sort) ?? "featured"}
            onChange={(event) => set(PARAM.sort, event.target.value)}
            className="h-11 rounded-full border border-line-strong bg-surface px-4 pr-8 text-sm font-medium outline-none transition-colors hover:border-ink focus:border-ink"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
