"use client";

import { useEffect, useState } from "react";
import { allColors, type FacetCounts, type ShopFacets } from "@/lib/data";
import { PARAM } from "@/lib/shop-params";
import { Close, Filter } from "../icons";
import { useShopUrl } from "./useShopUrl";

type Props = {
  queryString: string;
  counts: FacetCounts;
  facets: ShopFacets;
  activeCount: number;
};

const pricePresets = [
  { label: "Dưới 300k", min: "", max: "300000" },
  { label: "300k – 500k", min: "300000", max: "500000" },
  { label: "500k – 1tr", min: "500000", max: "1000000" },
  { label: "Trên 1tr", min: "1000000", max: "" },
];

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-[#e5e5e5] py-5 first:pt-0">
      <h3 className="text-xs font-black uppercase tracking-wider text-ink">{title}</h3>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

function Checkbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  const disabled = count === 0 && !checked;
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 py-1.5 text-xs sm:text-sm transition-colors ${
        disabled ? "cursor-not-allowed opacity-35" : "hover:text-[#e60012]"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="h-4 w-4 shrink-0 appearance-none rounded-none border border-[#999999] bg-white transition-colors checked:border-black checked:bg-black checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22%23ffffff%22 stroke-width=%222.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m3.5 8.5 3 3 6-6%22/></svg>')] checked:bg-center checked:bg-no-repeat"
      />
      <span className="flex-1 font-medium">{label}</span>
      <span className="text-xs text-[#777777]">({count})</span>
    </label>
  );
}

function Facets({ queryString, counts, facets }: Omit<Props, "activeCount">) {
  const { params, has, toggle, apply } = useShopUrl(queryString);

  const urlMin = params.get(PARAM.min) ?? "";
  const urlMax = params.get(PARAM.max) ?? "";
  const [min, setMin] = useState(urlMin);
  const [max, setMax] = useState(urlMax);
  const [lastRange, setLastRange] = useState(`${urlMin}|${urlMax}`);

  if (lastRange !== `${urlMin}|${urlMax}`) {
    setLastRange(`${urlMin}|${urlMax}`);
    setMin(urlMin);
    setMax(urlMax);
  }

  const applyPrice = (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    apply((next) => {
      next.delete(PARAM.min);
      next.delete(PARAM.max);
      if (min) next.set(PARAM.min, min);
      if (max) next.set(PARAM.max, max);
    });
  };

  const applyPreset = (pMin: string, pMax: string) => {
    setMin(pMin);
    setMax(pMax);
    apply((next) => {
      next.delete(PARAM.min);
      next.delete(PARAM.max);
      if (pMin) next.set(PARAM.min, pMin);
      if (pMax) next.set(PARAM.max, pMax);
    });
  };

  const flag = (key: string, label: string) => (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-xs sm:text-sm hover:text-[#e60012]">
      <input
        type="checkbox"
        checked={params.get(key) === "1"}
        onChange={(event) =>
          apply((next) => {
            next.delete(key);
            if (event.target.checked) next.set(key, "1");
          })
        }
        className="h-4 w-4 shrink-0 appearance-none rounded-none border border-[#999999] bg-white transition-colors checked:border-black checked:bg-black checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22%23ffffff%22 stroke-width=%222.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m3.5 8.5 3 3 6-6%22/></svg>')] checked:bg-center checked:bg-no-repeat"
      />
      <span className="font-medium">{label}</span>
    </label>
  );

  return (
    <div>
      <Group title="Danh mục">
        {facets.categories.map((category) => (
          <Checkbox
            key={category}
            label={category}
            count={counts.categories[category] ?? 0}
            checked={has(PARAM.category, category)}
            onChange={() => toggle(PARAM.category, category)}
          />
        ))}
      </Group>

      <Group title="Kích cỡ">
        <div className="flex flex-col gap-4">
          {facets.sizeGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-[11px] font-bold text-[#777777] uppercase tracking-wider">{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.sizes.map((size) => {
                  const checked = has(PARAM.size, size);
                  const count = counts.sizes[size] ?? 0;
                  return (
                    <button
                      key={size}
                      type="button"
                      aria-pressed={checked}
                      disabled={count === 0 && !checked}
                      onClick={() => toggle(PARAM.size, size)}
                      className={`h-9 min-w-[44px] border px-3 text-xs font-bold uppercase transition-all ${
                        checked
                          ? "border-black bg-black text-white shadow-2xs"
                          : "border-[#d5d5d5] bg-white text-ink hover:border-black"
                      } disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[#d5d5d5]`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Group>

      <Group title="Màu sắc">
        <div className="flex flex-wrap gap-2.5">
          {allColors.map((color) => {
            const checked = has(PARAM.color, color.name);
            const count = counts.colors[color.name] ?? 0;
            return (
              <button
                key={color.name}
                type="button"
                title={`${color.name} (${count})`}
                aria-label={`${color.name}, ${count} sản phẩm`}
                aria-pressed={checked}
                disabled={count === 0 && !checked}
                onClick={() => toggle(PARAM.color, color.name)}
                className={`grid h-8 w-8 place-items-center rounded-full ring-offset-2 ring-offset-white transition-all ${
                  checked ? "ring-2 ring-black scale-105" : "ring-1 ring-[#d5d5d5] hover:ring-black"
                } disabled:cursor-not-allowed disabled:opacity-25`}
              >
                <span
                  className="h-5 w-5 rounded-full shadow-inner border border-black/10"
                  style={{ backgroundColor: color.hex }}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Khoảng giá">
        {/* Preset buttons */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {pricePresets.map((preset) => {
            const isActive = min === preset.min && max === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.min, preset.max)}
                className={`border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "border-black bg-black text-white"
                    : "border-[#d5d5d5] bg-white text-ink/80 hover:border-black"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={applyPrice} className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={min}
            onChange={(event) => setMin(event.target.value)}
            onBlur={() => applyPrice()}
            placeholder="Từ đ"
            aria-label="Giá thấp nhất"
            className="h-10 w-full border border-[#d5d5d5] bg-white px-3 text-xs outline-none focus:border-black"
          />
          <span className="text-[#777777]">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={max}
            onChange={(event) => setMax(event.target.value)}
            onBlur={() => applyPrice()}
            placeholder="Đến đ"
            aria-label="Giá cao nhất"
            className="h-10 w-full border border-[#d5d5d5] bg-white px-3 text-xs outline-none focus:border-black"
          />
        </form>
      </Group>

      <Group title="Tình trạng">
        {flag(PARAM.sale, "Đang giảm giá")}
        {flag(PARAM.new, "Hàng mới về")}
        {flag(PARAM.stock, "Chỉ hiện hàng còn")}
      </Group>
    </div>
  );
}

export default function ShopFilters({ queryString, counts, facets, activeCount }: Props) {
  const { clearAll } = useShopUrl(queryString);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* ── Mobile Filter Trigger Button ── */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center gap-2 border border-black bg-white px-5 text-xs font-bold uppercase tracking-wider text-black shadow-xs transition-colors hover:bg-black hover:text-white active:scale-95"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>BỘ LỌC</span>
          {activeCount > 0 && (
            <span className="grid h-4 min-w-4 place-items-center bg-[#e60012] px-1 text-[10px] font-black text-white">
              {activeCount}
            </span>
          )}
        </button>

        {/* ── Mobile Filter Bottom Sheet ── */}
        {open && (
          <div className="fixed inset-0 z-60 flex flex-col justify-end" role="dialog" aria-modal="true">
            <div
              aria-hidden
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs fade-in"
            />
            <div className="relative z-10 flex w-full max-h-[85vh] flex-col bg-white shadow-2xl sheet-up">
              {/* Top Bar */}
              <div className="flex items-center justify-between border-b border-[#e5e5e5] px-6 py-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black uppercase tracking-wider">BỘ LỌC TÌM KIẾM</p>
                  {activeCount > 0 && (
                    <span className="bg-[#e60012] px-1.5 py-0.5 text-[10px] font-black text-white">
                      {activeCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Đóng bộ lọc"
                  className="grid h-8 w-8 place-items-center text-ink transition-colors hover:bg-black/5"
                >
                  <Close className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <Facets queryString={queryString} counts={counts} facets={facets} />
              </div>

              <div className="flex gap-3 border-t border-[#e5e5e5] bg-white px-6 py-4 pb-safe">
                <button
                  type="button"
                  onClick={clearAll}
                  className="h-11 flex-1 border border-black bg-white text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-black hover:text-white active:scale-95"
                >
                  Xoá tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-11 flex-1 bg-[#e60012] text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 active:scale-95"
                >
                  Xem kết quả
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop Sticky Sidebar ── */}
      <aside className="hidden lg:block">
        <div className="sticky top-[92px] max-h-[calc(100vh-112px)] overflow-y-auto pr-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#e5e5e5]">
            <p className="text-xs font-black uppercase tracking-wider text-black">BỘ LỌC TÌM KIẾM</p>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-[#e60012] font-bold uppercase tracking-wider underline underline-offset-4 transition-colors hover:text-black"
              >
                Xoá tất cả ({activeCount})
              </button>
            )}
          </div>
          <Facets queryString={queryString} counts={counts} facets={facets} />
        </div>
      </aside>
    </>
  );
}

