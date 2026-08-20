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
    <section className="border-b border-line py-5 first:pt-0">
      <h3 className="eyebrow text-ink/70">{title}</h3>
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
      className={`flex cursor-pointer items-center gap-3 py-2 text-[14px] sm:text-[15px] transition-opacity ${
        disabled ? "cursor-not-allowed opacity-35" : "hover:text-gold-deep"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="h-[18px] w-[18px] shrink-0 appearance-none rounded-[5px] border border-line-strong bg-surface transition-colors checked:border-ink checked:bg-ink checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22%23f5efe6%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m3.5 8.5 3 3 6-6%22/></svg>')] checked:bg-center checked:bg-no-repeat"
      />
      <span className="flex-1 font-medium">{label}</span>
      <span className="text-xs text-muted">({count})</span>
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
    <label className="flex cursor-pointer items-center gap-3 py-2 text-[14px] sm:text-[15px] hover:text-gold-deep">
      <input
        type="checkbox"
        checked={params.get(key) === "1"}
        onChange={(event) =>
          apply((next) => {
            next.delete(key);
            if (event.target.checked) next.set(key, "1");
          })
        }
        className="h-[18px] w-[18px] shrink-0 appearance-none rounded-[5px] border border-line-strong bg-surface transition-colors checked:border-ink checked:bg-ink checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22%23f5efe6%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m3.5 8.5 3 3 6-6%22/></svg>')] checked:bg-center checked:bg-no-repeat"
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
              <p className="mb-2 text-xs font-semibold text-muted uppercase tracking-wider">{group.label}</p>
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
                      className={`h-9 min-w-[44px] rounded-full border px-3 text-[13px] font-semibold transition-all ${
                        checked
                          ? "border-ink bg-ink text-cream shadow-xs"
                          : "border-line-strong bg-surface text-ink/80 hover:border-ink hover:text-ink"
                      } disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-line-strong`}
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
                className={`grid h-9 w-9 place-items-center rounded-full ring-offset-2 ring-offset-cream transition-all ${
                  checked ? "ring-2 ring-ink scale-105" : "ring-1 ring-line-strong hover:ring-ink"
                } disabled:cursor-not-allowed disabled:opacity-25`}
              >
                <span
                  className="h-6 w-6 rounded-full shadow-inner"
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
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-ink bg-ink text-cream font-semibold"
                    : "border-line-strong bg-surface text-ink/75 hover:border-ink"
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
            className="h-10 w-full rounded-xl border border-line-strong bg-surface px-3.5 text-xs sm:text-sm outline-none focus:border-ink"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={max}
            onChange={(event) => setMax(event.target.value)}
            onBlur={() => applyPrice()}
            placeholder="Đến đ"
            aria-label="Giá cao nhất"
            className="h-10 w-full rounded-xl border border-line-strong bg-surface px-3.5 text-xs sm:text-sm outline-none focus:border-ink"
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
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-5 text-sm font-semibold text-ink shadow-xs transition-colors hover:border-ink active:scale-95"
        >
          <Filter className="h-4 w-4 text-gold-deep" />
          <span>Bộ lọc</span>
          {activeCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[10px] font-bold text-cream">
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
              className="fixed inset-0 bg-ink/50 backdrop-blur-xs fade-in"
            />
            <div className="relative z-10 flex w-full max-h-[85vh] flex-col rounded-t-[24px] bg-cream shadow-2xl sheet-up">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1.5 w-12 rounded-full bg-ink/20" />
              </div>

              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">Bộ lọc sản phẩm</p>
                  {activeCount > 0 && (
                    <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-cream">
                      {activeCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Đóng bộ lọc"
                  className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  <Close />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <Facets queryString={queryString} counts={counts} facets={facets} />
              </div>

              <div className="flex gap-3 border-t border-line bg-surface/60 px-6 py-4 pb-safe">
                <button
                  type="button"
                  onClick={clearAll}
                  className="h-11 flex-1 rounded-full border border-line-strong bg-surface text-sm font-semibold text-ink transition-colors hover:border-ink active:scale-95"
                >
                  Xoá tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-11 flex-1 rounded-full bg-ink text-sm font-semibold text-cream transition-opacity hover:opacity-90 active:scale-95 shadow-xs"
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
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <p className="eyebrow font-bold">Bộ lọc sản phẩm</p>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-gold-deep font-semibold underline underline-offset-4 transition-colors hover:text-ink"
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

