"use client";

import Link from "next/link";
import { formatPrice, type Product } from "@/lib/data";
import { LOW_STOCK, useVariantSelection } from "@/lib/useVariantSelection";
import QuantityStepper from "../QuantityStepper";
import { Bag } from "../icons";

export default function ProductPurchase({ product }: { product: Product }) {
  const {
    color,
    size,
    qty,
    error,
    variant,
    price,
    stockBySize,
    colorSoldOut,
    isColorSoldOut,
    max,
    setQty,
    pickColor,
    pickSize,
    addToCart,
  } = useVariantSelection(product);

  const discountPercent = product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;

  return (
    <div id="product-purchase-box">
      {/* ── Giá sản phẩm ── */}
      <div className="flex items-baseline gap-3">
        <p className="text-2xl sm:text-3xl font-bold text-ink">{formatPrice(price)}</p>
        {product.comparePrice && price === product.price && (
          <>
            <p className="text-base sm:text-lg text-muted line-through">
              {formatPrice(product.comparePrice)}
            </p>
            {discountPercent > 0 && (
              <span className="eyebrow rounded-full bg-[#c2410c] px-2.5 py-1 text-[10px] font-bold text-white shadow-xs">
                Giảm {discountPercent}%
              </span>
            )}
          </>
        )}
      </div>

      {/* ── Lựa chọn màu sắc ── */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow text-ink/70">
            Màu sắc: <span className="font-semibold text-ink">{color}</span>
          </p>
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

      {/* ── Lựa chọn kích cỡ ── */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow text-ink/70">Kích cỡ</p>
          <button
            type="button"
            className="text-xs sm:text-[13px] text-muted underline underline-offset-4 transition-colors hover:text-ink"
            onClick={() =>
              document.getElementById("size-guide")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Hướng dẫn chọn size
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {product.sizes.map((option) => {
            const stock = stockBySize[option] ?? 0;
            const selected = size === option;
            return (
              <button
                key={option}
                type="button"
                disabled={stock === 0}
                onClick={() => pickSize(option)}
                aria-pressed={selected}
                className={`h-11 min-w-[56px] rounded-full border px-4 text-sm font-semibold transition-all ${
                  selected
                    ? "border-ink bg-ink text-cream shadow-xs"
                    : "border-line-strong bg-surface text-ink/80 hover:border-ink hover:text-ink"
                } disabled:cursor-not-allowed disabled:border-line disabled:text-muted/40 disabled:line-through disabled:hover:border-line disabled:bg-cream-dark/50`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* ── Trạng thái tồn kho ── */}
        <div className="mt-3 min-h-5 text-xs sm:text-[13px]">
          {colorSoldOut ? (
            <span className="text-muted">Màu này đã hết hàng — mời bạn chọn màu khác.</span>
          ) : variant && variant.stock === 0 ? (
            <span className="text-muted">Size này đã hết hàng.</span>
          ) : variant && variant.stock <= LOW_STOCK ? (
            <span className="text-gold-deep font-semibold">Chỉ còn {variant.stock} sản phẩm ở size này.</span>
          ) : variant ? (
            <span className="text-muted">Còn hàng — giao trong 1–2 ngày làm việc.</span>
          ) : (
            <span className="text-muted">Chọn kích cỡ của bạn.</span>
          )}
        </div>
      </div>

      {/* ── Số lượng & Nút Thêm vào giỏ ── */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <QuantityStepper value={qty} onChange={setQty} max={Math.max(max, 1)} />

        <button
          type="button"
          onClick={addToCart}
          disabled={colorSoldOut}
          className="inline-flex h-12 flex-1 min-w-[200px] items-center justify-center gap-2 rounded-full bg-ink px-7 text-sm font-semibold text-cream shadow-sm transition-all hover:bg-ink-soft hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Bag className="h-[18px] w-[18px]" />
          <span>{colorSoldOut ? "Hết hàng" : "Thêm vào giỏ"}</span>
        </button>
      </div>

      {error && (
        <p aria-live="polite" className="mt-3 text-xs sm:text-[13px] font-semibold text-gold-deep">
          {error}
        </p>
      )}

      <p className="mt-4 text-xs sm:text-[13px] leading-relaxed text-muted">
        Không cần đăng ký tài khoản — giỏ hàng được lưu tự động trên thiết bị này.{" "}
        <Link href="/cart" className="font-medium text-ink underline underline-offset-4 hover:text-gold-deep">
          Xem giỏ hàng
        </Link>
      </p>
    </div>
  );
}

