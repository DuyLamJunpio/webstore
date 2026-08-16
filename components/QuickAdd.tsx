"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, type Product } from "@/lib/data";
import { LOW_STOCK, useVariantSelection } from "@/lib/useVariantSelection";
import QuantityStepper from "./QuantityStepper";
import { Bag, Close } from "./icons";

/**
 * Chọn biến thể ngay từ thẻ sản phẩm. Bảng chọn là hộp thoại canh giữa chứ không
 * phải popover dính vào thẻ, để vẫn dùng được trên lưới hai cột chật trên điện thoại.
 */
function QuickAddDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const {
    color,
    size,
    qty,
    error,
    variant,
    stockBySize,
    colorSoldOut,
    isColorSoldOut,
    max,
    setQty,
    pickColor,
    pickSize,
    addToCart,
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
    // ngăn kéo giỏ hàng sẽ hiện lên ngay khi thêm xong — đóng bảng này lại phía sau
    if (addToCart()) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-70 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Thêm nhanh — ${product.name}`}
    >
      <button
        type="button"
        aria-label="Đóng bảng thêm nhanh"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
      />

      <div className="pop relative flex w-full max-w-lg flex-col overflow-hidden rounded-block bg-cream shadow-2xl">
        <div className="flex items-start gap-4 border-b border-line p-5">
          <Link
            href={`/products/${product.slug}`}
            onClick={onClose}
            className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-card bg-surface ring-1 ring-line"
          >
            <Image src={product.image} alt={product.name} fill sizes="80px" className="object-cover" />
          </Link>

          <div className="flex-1">
            <p className="eyebrow text-gold">{product.category}</p>
            <h2 className="mt-1 text-lg font-medium leading-snug">
              <Link href={`/products/${product.slug}`} onClick={onClose}>
                {product.name}
              </Link>
            </h2>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="font-medium">{formatPrice(product.price)}</span>
              {product.comparePrice && (
                <span className="text-[13px] text-muted line-through">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng thêm nhanh"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-ink/5"
          >
            <Close />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
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
                  className={`relative grid h-9 w-9 place-items-center rounded-full ring-offset-2 ring-offset-cream transition-all ${
                    color === option.name
                      ? "ring-2 ring-ink"
                      : "ring-1 ring-line-strong hover:ring-ink"
                  }`}
                >
                  <span
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: option.hex }}
                    aria-hidden
                  />
                  {soldOut && (
                    <span aria-hidden className="absolute inset-0 grid place-items-center">
                      <span className="h-px w-7 rotate-45 bg-ink/60" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="eyebrow mt-6 text-ink/60">Size</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((option) => {
              const stock = stockBySize[option] ?? 0;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={stock === 0}
                  onClick={() => pickSize(option)}
                  aria-pressed={size === option}
                  className={`h-10 min-w-[52px] rounded-full border px-3.5 text-sm font-medium transition-colors ${
                    size === option
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
            ) : variant && variant.stock <= LOW_STOCK ? (
              <span className="text-gold-deep">Chỉ còn {variant.stock} sản phẩm ở size này.</span>
            ) : variant ? (
              <span className="text-muted">Còn hàng — giao trong 1–2 ngày làm việc.</span>
            ) : (
              <span className="text-muted">Chọn size để tiếp tục.</span>
            )}
          </p>
        </div>

        <div className="border-t border-line p-5">
          <div className="flex flex-wrap items-center gap-3">
            <QuantityStepper value={qty} onChange={setQty} max={Math.max(max, 1)} />
            <button
              type="button"
              onClick={submit}
              disabled={colorSoldOut}
              className="inline-flex h-12 min-w-[180px] flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Bag className="h-[18px] w-[18px]" />
              {colorSoldOut ? "Hết hàng" : "Thêm vào giỏ"}
            </button>
          </div>

          <p aria-live="polite" className="mt-3 min-h-5 text-[13px] text-gold-deep">
            {error}
          </p>

          <Link
            href={`/products/${product.slug}`}
            onClick={onClose}
            className="text-[13px] text-muted underline underline-offset-4 transition-colors hover:text-ink"
          >
            Xem chi tiết đầy đủ
          </Link>
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
        className="absolute inset-x-3 bottom-3 z-10 h-10 rounded-full bg-cream/95 text-sm font-medium shadow-sm backdrop-blur transition-all duration-300 hover:bg-cream lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-visible:translate-y-0 lg:focus-visible:opacity-100"
      >
        Thêm nhanh
      </button>

      {open && <QuickAddDialog product={product} onClose={() => setOpen(false)} />}
    </>
  );
}
