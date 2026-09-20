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
    <div className="flex flex-col gap-4 border-y border-[#e5e5e5] py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex h-10 flex-1 items-center gap-3 border border-[#d5d5d5] bg-white px-3.5 transition-colors focus-within:border-black md:max-w-md">
        <Search className="h-4 w-4 shrink-0 text-[#777777]" />
        <input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Tìm áo thun, áo khoác, quần jeans, phụ kiện…"
          aria-label="Tìm kiếm sản phẩm"
          className="h-full flex-1 bg-transparent text-xs sm:text-sm text-ink outline-none placeholder:text-[#999999] [&::-webkit-search-cancel-button]:hidden"
        />
        {text && (
          <button
            type="button"
            onClick={() => setText("")}
            aria-label="Xoá từ khoá"
            className="grid h-5 w-5 shrink-0 place-items-center text-[#777777] transition-colors hover:text-black"
          >
            <Close className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 md:justify-end">
        <p aria-live="polite" className={`text-xs font-bold uppercase tracking-wider text-[#777777] ${pending ? "opacity-50" : ""}`}>
          {total} SẢN PHẨM
        </p>

        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <span className="text-[#777777]">SẮP XẾP:</span>
          <select
            value={params.get(PARAM.sort) ?? "featured"}
            onChange={(event) => set(PARAM.sort, event.target.value)}
            className="h-10 border border-[#d5d5d5] bg-white px-3 pr-8 text-xs font-bold uppercase tracking-wider text-ink outline-none transition-colors hover:border-black focus:border-black cursor-pointer"
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
