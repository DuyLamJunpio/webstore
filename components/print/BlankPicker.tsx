"use client";

/**
 * Lưới chọn phôi kèm hàng nút lọc theo danh mục.
 *
 * Lọc Ở NGAY TRÌNH DUYỆT chứ không qua URL như trang cửa hàng. Hai chỗ khác
 * nhau ở chỗ đáng kể: /shop lọc trên hàng nghìn sản phẩm nằm dưới máy chủ và
 * cần chia sẻ được đường dẫn đã lọc, còn ở đây cả danh mục phôi đã nằm sẵn
 * trong bộ nhớ — thêm một vòng điều hướng chỉ để ẩn vài thẻ là chậm hơn mà
 * chẳng được gì.
 *
 * Hàng nút chỉ hiện khi có ít nhất hai nhóm; một nút "Tất cả" đứng trơ trọi
 * không lọc được gì cả.
 */

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/data";
import { blankCategories, coverMockup, UNSORTED_BLANKS, type PrintBlank } from "@/lib/print";

/** Khoá của nút "Tất cả". Cố ý khác `UNSORTED_BLANKS` — rỗng là nhóm "Khác". */
const ALL = "*";

export default function BlankPicker({ blanks }: { blanks: PrintBlank[] }) {
  const categories = useMemo(() => blankCategories(blanks), [blanks]);
  const [active, setActive] = useState<string>(ALL);

  /*
   * Danh mục đang chọn có thể biến mất sau một lần trang được dựng lại — chủ
   * shop xếp lại phôi là chuyện thường. Rơi về "Tất cả" thay vì bày lưới rỗng.
   */
  const selected = categories.some((c) => c.slug === active) ? active : ALL;

  const visible =
    selected === ALL
      ? blanks
      : blanks.filter((blank) => (blank.category?.slug ?? UNSORTED_BLANKS) === selected);

  if (blanks.length === 0) {
    return (
      <p className="measure mt-6 text-center text-muted">
        Shop đang chuẩn bị phôi in. Bạn quay lại sau ít hôm nhé.
      </p>
    );
  }

  return (
    <>
      {categories.length > 1 && (
        <div
          role="group"
          aria-label="Lọc phôi theo danh mục"
          className="mt-6 -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          <Chip
            label="Tất cả"
            count={blanks.length}
            active={selected === ALL}
            onSelect={() => setActive(ALL)}
          />
          {categories.map((category) => (
            <Chip
              key={category.slug || "khac"}
              label={category.name}
              count={category.count}
              active={selected === category.slug}
              onSelect={() => setActive(category.slug)}
            />
          ))}
        </div>
      )}

      <ul className="mt-8 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {visible.map((blank) => {
          const cover = coverMockup(blank);

          return (
            <li key={blank.id}>
              <Link
                href={`/in-ao/${blank.slug}`}
                className="group block rounded-block border border-line bg-surface overflow-hidden transition-all hover:border-line-strong hover:shadow-xs"
              >
                <div className="relative aspect-4/5 bg-cream-dark/40">
                  {cover ? (
                    <Image
                      src={cover.url}
                      alt={blank.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-xs text-muted">
                      Chưa có ảnh
                    </span>
                  )}
                </div>

                <div className="p-4">
                  {blank.category && (
                    <p className="eyebrow text-[10px] text-gold-deep">{blank.category.name}</p>
                  )}
                  <h3 className="mt-1 font-semibold text-ink leading-snug">{blank.name}</h3>
                  <p className="mt-1 text-sm text-muted tabular-nums">
                    Từ {formatPrice(blank.base_price)}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-1.5">
                    {blank.colors.slice(0, 6).map((color) => (
                      <span
                        key={color.id}
                        title={color.name}
                        className="h-4 w-4 rounded-full ring-1 ring-line-strong"
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                    {blank.colors.length > 6 && (
                      <span className="text-[11px] text-muted">+{blank.colors.length - 6}</span>
                    )}
                  </p>
                  <p className="mt-2.5 text-xs text-muted">
                    {blank.position_keys.length} chỗ in · từ {blank.moq} áo · {blank.lead_days} ngày
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Chip({
  label,
  count,
  active,
  onSelect,
}: {
  label: string;
  count: number;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`inline-flex h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium transition-colors ${
        active
          ? "border-ink bg-ink text-cream"
          : "border-line-strong bg-surface text-ink hover:border-ink"
      }`}
    >
      <span>{label}</span>
      <span className={`text-[11px] tabular-nums ${active ? "text-cream/70" : "text-muted"}`}>
        {count}
      </span>
    </button>
  );
}
