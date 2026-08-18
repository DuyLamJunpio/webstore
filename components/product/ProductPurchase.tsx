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

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <p className="text-2xl font-medium">{formatPrice(price)}</p>
        {/* Giá gạch chỉ đúng với giá chung; biến thể có giá riêng thì bỏ. */}
        {product.comparePrice && price === product.price && (
          <>
            <p className="text-lg text-muted line-through">{formatPrice(product.comparePrice)}</p>
            <span className="eyebrow rounded-full bg-gold px-2.5 py-1.5 text-[9px] leading-none text-cream">
              Giảm {Math.round((1 - product.price / product.comparePrice) * 100)}%
            </span>
          </>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow text-ink/60">Màu sắc</p>
          <p className="text-sm text-muted">{color}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {product.colors.map((option) => {
            const soldOut = isColorSoldOut(option.name);
            return (
              <button
                key={option.name}
                type="button"
                onClick={() => pickColor(option.name)}
                aria-pressed={color === option.name}
                aria-label={`${option.name}${soldOut ? " — hết hàng" : ""}`}
                title={option.name}
                className={`relative grid h-10 w-10 place-items-center rounded-full ring-offset-2 ring-offset-cream transition-all ${
                  color === option.name ? "ring-2 ring-ink" : "ring-1 ring-line-strong hover:ring-ink"
                }`}
              >
                <span
                  className="h-7 w-7 rounded-full"
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

      <div className="mt-7">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow text-ink/60">Size</p>
          <button
            type="button"
            className="text-[13px] text-muted underline underline-offset-4 transition-colors hover:text-ink"
            onClick={() =>
              document.getElementById("size-guide")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Hướng dẫn chọn size
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
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
                className={`h-11 min-w-[56px] rounded-full border px-4 text-sm font-medium transition-colors ${
                  selected
                    ? "border-ink bg-ink text-cream"
                    : "border-line-strong text-ink/80 hover:border-ink hover:text-ink"
                } disabled:cursor-not-allowed disabled:border-line disabled:text-muted/50 disabled:line-through disabled:hover:border-line`}
              >
                {option}
              </button>
            );
          })}
        </div>

        <p className="mt-3 h-5 text-[13px]">
          {colorSoldOut ? (
            <span className="text-muted">Màu này đã hết hàng — mời bạn chọn màu khác.</span>
          ) : variant && variant.stock === 0 ? (
            <span className="text-muted">Size này đã hết hàng.</span>
          ) : variant && variant.stock <= LOW_STOCK ? (
            <span className="text-gold-deep">Chỉ còn {variant.stock} sản phẩm ở size này.</span>
          ) : variant ? (
            <span className="text-muted">Còn hàng — giao trong 1–2 ngày làm việc.</span>
          ) : null}
        </p>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <QuantityStepper value={qty} onChange={setQty} max={Math.max(max, 1)} />

        <button
          type="button"
          onClick={addToCart}
          disabled={colorSoldOut}
          className="inline-flex h-12 flex-1 min-w-[200px] items-center justify-center gap-2 rounded-full bg-ink px-7 text-sm font-medium text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Bag className="h-[18px] w-[18px]" />
          {colorSoldOut ? "Hết hàng" : "Thêm vào giỏ"}
        </button>
      </div>

      <p aria-live="polite" className="mt-3 min-h-5 text-[13px] text-gold-deep">
        {error}
      </p>

      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        Không cần đăng ký tài khoản — giỏ hàng được lưu ngay trên thiết bị này.{" "}
        <Link href="/cart" className="underline underline-offset-4 transition-colors hover:text-ink">
          Xem giỏ hàng
        </Link>
      </p>
    </div>
  );
}
