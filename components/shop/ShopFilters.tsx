"use client";

import { useEffect, useState } from "react";
import { allColors, type FacetCounts, type ShopFacets } from "@/lib/data";
import { PARAM } from "@/lib/shop-params";
import { Close } from "../icons";
import { useShopUrl } from "./useShopUrl";

type Props = {
  queryString: string;
  counts: FacetCounts;
  /** danh mục, nhóm size và khoảng giá dựng từ hàng đang bán */
  facets: ShopFacets;
  activeCount: number;
};

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line py-6 first:pt-0">
      <h3 className="eyebrow text-ink/60">{title}</h3>
      <div className="mt-4">{children}</div>
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
      className={`flex cursor-pointer items-center gap-3 py-1.5 text-[15px] ${
        disabled ? "cursor-not-allowed opacity-40" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="h-[18px] w-[18px] shrink-0 appearance-none rounded-[5px] border border-line-strong bg-surface transition-colors checked:border-ink checked:bg-ink checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22%23f5efe6%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m3.5 8.5 3 3 6-6%22/></svg>')] checked:bg-center checked:bg-no-repeat"
      />
      <span className="flex-1">{label}</span>
      <span className="text-[13px] text-muted">{count}</span>
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

  // nhận lại khoảng giá đặt ở chỗ khác (thẻ lọc, "Xoá tất cả", nút Back)
  if (lastRange !== `${urlMin}|${urlMax}`) {
    setLastRange(`${urlMin}|${urlMax}`);
    setMin(urlMin);
    setMax(urlMax);
  }

  const applyPrice = (event: React.FormEvent) => {
    event.preventDefault();
    apply((next) => {
      next.delete(PARAM.min);
      next.delete(PARAM.max);
      if (min) next.set(PARAM.min, min);
      if (max) next.set(PARAM.max, max);
    });
  };

  const flag = (key: string, label: string) => (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-[15px]">
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
      {label}
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
              <p className="mb-2 text-[13px] text-muted">{group.label}</p>
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
                      className={`h-9 min-w-[44px] rounded-full border px-3 text-[13px] font-medium transition-colors ${
                        checked
                          ? "border-ink bg-ink text-cream"
                          : "border-line-strong text-ink/75 hover:border-ink hover:text-ink"
                      } disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line-strong`}
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
        <div className="flex flex-wrap gap-3">
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
                  checked ? "ring-2 ring-ink" : "ring-1 ring-line-strong hover:ring-ink"
                } disabled:cursor-not-allowed disabled:opacity-30`}
              >
                <span
                  className="h-6 w-6 rounded-full"
                  style={{ backgroundColor: color.hex }}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Giá">
        <form onSubmit={applyPrice} className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={min}
            onChange={(event) => setMin(event.target.value)}
            onBlur={applyPrice}
            placeholder={`${facets.priceBounds.min}`}
            aria-label="Giá thấp nhất"
            className="h-10 w-full rounded-full border border-line-strong bg-surface px-4 text-sm outline-none focus:border-ink"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={max}
            onChange={(event) => setMax(event.target.value)}
            onBlur={applyPrice}
            placeholder={`${facets.priceBounds.max}`}
            aria-label="Giá cao nhất"
            className="h-10 w-full rounded-full border border-line-strong bg-surface px-4 text-sm outline-none focus:border-ink"
          />
          <button type="submit" className="sr-only">
            Áp dụng khoảng giá
          </button>
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
      {/* mobile: nút nằm trong luồng nội dung, bảng lọc mở ra dạng ngăn kéo */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong px-5 text-sm font-medium transition-colors hover:border-ink"
        >
          Bộ lọc
          {activeCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[11px] text-cream">
              {activeCount}
            </span>
          )}
        </button>

        {open && (
          <div className="fixed inset-0 z-60">
            <button
              type="button"
              aria-label="Đóng bộ lọc"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            />
            <div className="absolute inset-y-0 left-0 flex w-[min(88vw,360px)] flex-col bg-cream shadow-2xl">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <p className="text-lg font-medium">Bộ lọc</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Đóng bộ lọc"
                  className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-ink/5"
                >
                  <Close />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-6">
                <Facets queryString={queryString} counts={counts} facets={facets} />
              </div>

              <div className="flex gap-3 border-t border-line px-5 py-4">
                <button
                  type="button"
                  onClick={clearAll}
                  className="h-11 flex-1 rounded-full border border-line-strong text-sm font-medium transition-colors hover:border-ink"
                >
                  Xoá tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-11 flex-1 rounded-full bg-ink text-sm font-medium text-cream transition-opacity hover:opacity-90"
                >
                  Xem kết quả
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* desktop: cột lọc dính theo trang */}
      <aside className="hidden lg:block">
        <div className="sticky top-[92px] max-h-[calc(100vh-112px)] overflow-y-auto pr-2">
          <div className="flex items-center justify-between pb-4">
            <p className="eyebrow">Bộ lọc</p>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[13px] text-muted underline underline-offset-4 transition-colors hover:text-ink"
              >
                Xoá tất cả
              </button>
            )}
          </div>
          <Facets queryString={queryString} counts={counts} facets={facets} />
        </div>
      </aside>
    </>
  );
}
