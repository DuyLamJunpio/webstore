"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, type Product } from "@/lib/data";
import { LOW_STOCK, useVariantSelection } from "@/lib/useVariantSelection";
import QuantityStepper from "./QuantityStepper";
import { Bag, Bolt, Close, Plus, Spinner } from "./icons";

/**
 * Chọn biến thể nhanh ngay từ thẻ sản phẩm.
 * Trên mobile: Bottom sheet trượt từ đáy màn hình, chạm kéo thân thiện.
 * Trên desktop: Dialog canh giữa tinh tế.
 */
function QuickAddDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const {
    color,
    size,
    qty,
    error,
    variant,
    isBuying,
    price,
    stockBySize,
    colorSoldOut,
    isColorSoldOut,
    max,
    setQty,
    pickColor,
    pickSize,
    addToCart,
    buyNow,
  } = useVariantSelection(product);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const submit = () => {
    if (addToCart()) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-70 flex flex-col justify-end sm:grid sm:place-items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Thêm nhanh — ${product.name}`}
    >
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 bg-ink/50 backdrop-blur-xs fade-in"
      />

      {/* ── Container: Bottom Sheet on Mobile, Centered Modal on Desktop ── */}
      <div className="relative z-10 flex w-full max-h-[88vh] flex-col overflow-hidden rounded-t-[24px] bg-cream shadow-2xl sheet-up sm:max-w-lg sm:rounded-block sm:pop">
        {/* Mobile handle indicator */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-ink/20" />
        </div>

        <div className="flex items-start gap-4 border-b border-line p-5">
          <Link
            href={`/products/${product.slug}`}
            onClick={onClose}
            className="relative aspect-square w-18 shrink-0 overflow-hidden rounded-card bg-surface ring-1 ring-line"
          >
            <Image src={product.image} alt={product.name} fill sizes="80px" className="object-cover" />
          </Link>

          <div className="flex-1 min-w-0">
            <p className="eyebrow text-gold">{product.category}</p>
            <h2 className="mt-1 text-base sm:text-lg font-semibold leading-snug truncate">
              <Link href={`/products/${product.slug}`} onClick={onClose} className="hover:text-gold-deep">
                {product.name}
              </Link>
            </h2>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-bold text-ink">{formatPrice(price)}</span>
              {product.comparePrice && price === product.price && (
                <span className="text-xs sm:text-sm text-muted line-through">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng thêm nhanh"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <Close />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* ── Chọn màu ── */}
          <div>
            <div className="flex items-baseline justify-between">
              <p className="eyebrow text-ink/70">Màu sắc: <span className="font-medium text-ink">{color}</span></p>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {product.colors.map((option) => {
                const soldOut = isColorSoldOut(option.name);
                const isSelected = color === option.name;
                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => pickColor(option.name)}
                    aria-pressed={isSelected}
                    aria-label={`${option.name}${soldOut ? " — hết hàng" : ""}`}
                    title={option.name}
                    className={`relative grid h-10 w-10 place-items-center rounded-full ring-offset-2 ring-offset-cream transition-all ${
                      isSelected
                        ? "ring-2 ring-ink scale-105"
                        : "ring-1 ring-line-strong hover:ring-ink hover:scale-105"
                    }`}
                  >
                    <span
                      className="h-7 w-7 rounded-full shadow-inner"
                      style={{ backgroundColor: option.hex }}
                      aria-hidden
                    />
                    {soldOut && (
                      <span aria-hidden className="absolute inset-0 grid place-items-center">
                        <span className="h-px w-8 rotate-45 bg-ink/60" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Chọn size ── */}
          <div>
            <p className="eyebrow text-ink/70">Kích cỡ</p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {product.sizes.map((option) => {
                const stock = stockBySize[option] ?? 0;
                const isSelected = size === option;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={stock === 0}
                    onClick={() => pickSize(option)}
                    aria-pressed={isSelected}
                    className={`h-11 min-w-[56px] rounded-full border px-4 text-sm font-semibold transition-all ${
                      isSelected
                        ? "border-ink bg-ink text-cream shadow-xs"
                        : "border-line-strong text-ink/80 hover:border-ink hover:text-ink bg-surface"
                    } disabled:cursor-not-allowed disabled:border-line disabled:text-muted/40 disabled:line-through disabled:hover:border-line disabled:bg-cream-dark/50`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 min-h-5 text-xs sm:text-[13px]">
              {colorSoldOut ? (
                <span className="text-muted">Màu này đã hết hàng — mời bạn chọn màu khác.</span>
              ) : variant && variant.stock <= LOW_STOCK ? (
                <span className="text-gold-deep font-medium">Chỉ còn {variant.stock} sản phẩm ở size này.</span>
              ) : variant ? (
                <span className="text-muted">Còn hàng — giao trong 1–2 ngày làm việc.</span>
              ) : (
                <span className="text-muted">Chọn size để tiếp tục.</span>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-line p-5 pb-6 sm:pb-5 pb-safe bg-surface/50">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs sm:text-[13px] font-semibold text-ink/70">Số lượng:</span>
            <QuantityStepper value={qty} onChange={setQty} max={Math.max(max, 1)} />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={submit}
              disabled={colorSoldOut}
              className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-surface px-3 text-xs sm:text-sm font-semibold text-ink transition-all hover:bg-ink hover:text-cream active:scale-[0.99] disabled:cursor-not-allowed disabled:border-line disabled:text-muted shadow-xs"
            >
              <Bag className="h-4 w-4" />
              <span>{colorSoldOut ? "Hết hàng" : "Thêm vào giỏ"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (buyNow()) onClose();
              }}
              disabled={colorSoldOut || isBuying}
              className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-ink px-3 text-xs sm:text-sm font-semibold text-cream shadow-sm transition-all hover:bg-ink-soft active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-ink/40"
            >
              {isBuying ? (
                <>
                  <Spinner className="h-4 w-4 text-gold" />
                  <span>Đang xử lý…</span>
                </>
              ) : (
                <>
                  <Bolt className="h-4 w-4 text-gold" />
                  <span>{colorSoldOut ? "Hết hàng" : "Mua ngay"}</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <p aria-live="polite" className="mt-2 text-xs font-medium text-gold-deep text-center">
              {error}
            </p>
          )}

          <div className="mt-3 text-center">
            <Link
              href={`/products/${product.slug}`}
              onClick={onClose}
              className="text-xs text-muted underline underline-offset-4 hover:text-ink"
            >
              Xem chi tiết sản phẩm đầy đủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuickAdd({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Mobile: Nút tròn + nhỏ gọn góc phải không che ảnh ── */}
      {/* ── Desktop: Nút ngang hiện khi hover ── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Thêm nhanh ${product.name} vào giỏ hàng`}
        className="absolute right-2.5 bottom-2.5 z-10 grid h-8.5 w-8.5 place-items-center rounded-full bg-white/95 text-ink shadow-md backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-90 lg:inset-x-3 lg:w-auto lg:h-10 lg:flex lg:items-center lg:justify-center lg:gap-1.5 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden lg:inline text-xs font-semibold">Thêm nhanh</span>
      </button>

      {open && <QuickAddDialog product={product} onClose={() => setOpen(false)} />}
    </>
  );
}


