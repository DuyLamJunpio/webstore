"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, type Product } from "@/lib/data";
import { LOW_STOCK, useVariantSelection } from "@/lib/useVariantSelection";
import QuantityStepper from "./QuantityStepper";
import { Bag, Bolt, Close, Plus, Spinner } from "./icons";
import ProductStylePicker from "./product/ProductStylePicker";

/**
 * Chọn biến thể nhanh ngay từ thẻ sản phẩm.
 * Trên mobile: Bottom sheet trượt từ đáy màn hình, chạm kéo thân thiện.
 * Trên desktop: Dialog canh giữa tinh tế.
 */
function QuickAddDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const {
    styles,
    style,
    color,
    size,
    qty,
    error,
    variant,
    isBuying,
    price,
    availableColors,
    availableSizes,
    stockBySize,
    styleSoldOut,
    colorSoldOut,
    isStyleSoldOut,
    isColorSoldOut,
    max,
    setQty,
    pickStyle,
    pickColor,
    pickSize,
    addToCart,
    buyNow,
  } = useVariantSelection(product);

  const discountPercent = product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;
  const showDiscount = price === product.price && discountPercent > 0;

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
      <div className="relative z-10 flex w-full max-h-[88vh] flex-col overflow-hidden bg-white shadow-2xl sheet-up sm:max-w-lg sm:border sm:border-line sm:pop">
        {/* Mobile handle indicator */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 bg-black/20" />
        </div>

        <div className="flex items-start gap-4 border-b border-line p-5">
          <Link
            href={`/products/${product.slug}`}
            onClick={onClose}
            className="relative aspect-square w-18 shrink-0 overflow-hidden bg-[#f4f4f4] border border-line"
          >
            <Image src={style.image || product.image} alt={product.name} fill sizes="80px" className="object-cover" />
          </Link>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#767676]">{product.category}</p>
            <h2 className="mt-0.5 text-base font-bold leading-snug truncate text-ink">
              <Link href={`/products/${product.slug}`} onClick={onClose} className="hover:text-[#8f633e]">
                {product.name}
              </Link>
            </h2>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className={`text-base font-bold ${showDiscount ? "text-[#8f633e]" : "text-ink"}`}>{formatPrice(price)}</span>
              {showDiscount && product.comparePrice && (
                <>
                  <span className="text-xs text-muted line-through">
                    {formatPrice(product.comparePrice)}
                  </span>
                  <span className="bg-[#8f633e]/10 px-1 py-0.5 text-[9px] font-bold text-[#8f633e]">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng thêm nhanh"
            className="grid h-8 w-8 shrink-0 place-items-center text-muted transition-colors hover:bg-black/5 hover:text-ink"
          >
            <Close />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <ProductStylePicker
            styles={styles}
            selected={style}
            onSelect={pickStyle}
            isSoldOut={isStyleSoldOut}
          />

          {/* ── Chọn màu ── */}
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-ink/80">Màu sắc: <span className="font-bold text-ink">{color}</span></p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {availableColors.map((option) => {
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
                    className={`relative grid h-9 w-9 place-items-center transition-all ${
                      isSelected
                        ? "ring-2 ring-black"
                        : "ring-1 ring-line-strong hover:ring-black"
                    }`}
                  >
                    <span
                      className="h-6 w-6 shadow-inner"
                      style={{ backgroundColor: option.hex }}
                      aria-hidden
                    />
                    {soldOut && (
                      <span aria-hidden className="absolute inset-0 grid place-items-center">
                        <span className="h-px w-8 rotate-45 bg-black/60" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Chọn size ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink/80">Kích cỡ</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableSizes.map((option) => {
                const stock = stockBySize[option] ?? 0;
                const isSelected = size === option;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={stock === 0}
                    onClick={() => pickSize(option)}
                    aria-pressed={isSelected}
                    className={`h-10 min-w-[52px] border px-3 text-xs font-bold tracking-wider transition-all ${
                      isSelected
                        ? "border-black bg-black text-white"
                        : "border-[#cccccc] text-ink hover:border-black bg-white"
                    } disabled:cursor-not-allowed disabled:border-line disabled:text-muted/40 disabled:line-through disabled:bg-[#f4f4f4]`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 min-h-5 text-xs">
              {styleSoldOut ? (
                <span className="text-muted">Mẫu này đã hết hàng — mời bạn chọn mẫu khác.</span>
              ) : colorSoldOut ? (
                <span className="text-muted">Màu này đã hết hàng — mời bạn chọn màu khác.</span>
              ) : variant && variant.stock <= LOW_STOCK ? (
                <span className="text-[#8f633e] font-semibold">Chỉ còn {variant.stock} sản phẩm ở size này.</span>
              ) : variant ? (
                <span className="text-muted">Còn hàng — giao trong 1–2 ngày làm việc.</span>
              ) : (
                <span className="text-muted">Chọn size để tiếp tục.</span>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-line p-5 pb-6 sm:pb-5 pb-safe bg-[#f7f7f7]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/70">Số lượng:</span>
            <QuantityStepper value={qty} onChange={setQty} max={Math.max(max, 1)} />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={submit}
              disabled={styleSoldOut || colorSoldOut}
              className="inline-flex h-11 w-full items-center justify-center gap-1.5 border-2 border-black bg-white px-3 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:text-muted"
            >
              <Bag className="h-4 w-4" />
              <span>{styleSoldOut || colorSoldOut ? "Hết hàng" : "Thêm vào giỏ"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (buyNow()) onClose();
              }}
              disabled={styleSoldOut || colorSoldOut || isBuying}
              className="inline-flex h-11 w-full items-center justify-center gap-1.5 bg-[#8f633e] px-3 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-[#734d2c] disabled:cursor-not-allowed disabled:bg-black/30"
            >
              {isBuying ? (
                <>
                  <Spinner className="h-4 w-4 text-white" />
                  <span>Đang xử lý…</span>
                </>
              ) : (
                <>
                  <Bolt className="h-4 w-4 text-white" />
                  <span>{styleSoldOut || colorSoldOut ? "Hết hàng" : "Mua ngay"}</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <p aria-live="polite" className="mt-2 text-xs font-bold text-[#8f633e] text-center">
              {error}
            </p>
          )}

          <div className="mt-3 text-center">
            <Link
              href={`/products/${product.slug}`}
              onClick={onClose}
              className="text-xs text-muted underline underline-offset-4 hover:text-ink font-medium"
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Thêm nhanh ${product.name} vào giỏ hàng`}
        className="absolute right-2 bottom-2 z-10 grid h-8 w-8 place-items-center bg-white text-ink border border-line shadow-sm transition-all duration-150 hover:bg-black hover:text-white active:scale-95 lg:inset-x-2 lg:w-auto lg:h-9 lg:flex lg:items-center lg:justify-center lg:gap-1.5 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden lg:inline text-[11px] font-bold uppercase tracking-wider">Thêm nhanh</span>
      </button>

      {open && <QuickAddDialog product={product} onClose={() => setOpen(false)} />}
    </>
  );
}
