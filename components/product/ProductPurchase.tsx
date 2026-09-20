"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice, type Product } from "@/lib/data";
import { LOW_STOCK } from "@/lib/useVariantSelection";
import QuantityStepper from "../QuantityStepper";
import { Bag, Bolt, Spinner } from "../icons";
import ProductStylePicker from "./ProductStylePicker";
import SizeGuideModal from "./SizeGuideModal";
import { useSharedVariantSelection } from "./VariantSelectionProvider";

export default function ProductPurchase({ product }: { product: Product }) {
  const [showSizeGuide, setShowSizeGuide] = useState(false);
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
  } = useSharedVariantSelection();


  const discountPercent = product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;
  const showDiscount = price === product.price && discountPercent > 0;

  return (
    <div id="product-purchase-box">
      {/* ── Giá sản phẩm ── */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
        <p className={`text-2xl sm:text-3xl font-black ${showDiscount ? "text-[#e60012]" : "text-ink"}`}>{formatPrice(price)}</p>
        {showDiscount && product.comparePrice && (
          <>
            <p className="text-base sm:text-lg text-[#777777] line-through">
              {formatPrice(product.comparePrice)}
            </p>
            <span className="bg-[#e60012] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-2xs">
              GIẢM {discountPercent}%
            </span>
          </>
        )}
      </div>

      <ProductStylePicker
        styles={styles}
        selected={style}
        onSelect={pickStyle}
        isSoldOut={isStyleSoldOut}
        className="mt-6"
      />

      {/* ── Lựa chọn màu sắc ── */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-[#666666]">
            MÀU SẮC: <span className="font-black text-ink">{color}</span>
          </p>
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
                className={`relative grid h-9 w-9 place-items-center rounded-full ring-offset-2 ring-offset-white transition-all ${
                  isSelected
                    ? "ring-2 ring-black scale-105"
                    : "ring-1 ring-[#d5d5d5] hover:ring-black"
                }`}
              >
                <span
                  className="h-6 w-6 rounded-full shadow-inner border border-black/10"
                  style={{ backgroundColor: option.hex }}
                  aria-hidden
                />
                {soldOut && (
                  <span aria-hidden className="absolute inset-0 grid place-items-center">
                    <span className="h-px w-8 rotate-45 bg-black/70" />
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
          <p className="text-xs font-bold uppercase tracking-wider text-[#666666]">KÍCH CỠ</p>
          <button
            type="button"
            className="text-xs text-black font-bold uppercase tracking-wider underline underline-offset-4 transition-colors hover:text-[#e60012]"
            onClick={() => setShowSizeGuide(true)}
          >
            Bảng hướng dẫn chọn size
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {availableSizes.map((option) => {
            const stock = stockBySize[option] ?? 0;
            const selected = size === option;
            return (
              <button
                key={option}
                type="button"
                disabled={stock === 0}
                onClick={() => pickSize(option)}
                aria-pressed={selected}
                className={`h-10 min-w-[52px] border px-4 text-xs font-bold uppercase transition-all ${
                  selected
                    ? "border-black bg-black text-white shadow-2xs"
                    : "border-[#d5d5d5] bg-white text-ink hover:border-black"
                } disabled:cursor-not-allowed disabled:border-[#e5e5e5] disabled:text-[#999999]/40 disabled:line-through disabled:bg-[#f7f7f7]`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* ── Trạng thái tồn kho ── */}
        <div className="mt-3 min-h-5 text-xs">
          {styleSoldOut ? (
            <span className="text-[#777777]">Mẫu này đã hết hàng — mời bạn chọn mẫu khác.</span>
          ) : colorSoldOut ? (
            <span className="text-[#777777]">Màu này đã hết hàng — mời bạn chọn màu khác.</span>
          ) : variant && variant.stock === 0 ? (
            <span className="text-[#777777]">Size này đã hết hàng.</span>
          ) : variant && variant.stock <= LOW_STOCK ? (
            <span className="text-[#e60012] font-bold">Chỉ còn {variant.stock} sản phẩm ở size này.</span>
          ) : variant ? (
            <span className="text-[#777777]">Còn hàng — giao trong 1–2 ngày làm việc.</span>
          ) : (
            <span className="text-[#777777]">Vui lòng chọn kích cỡ phù hợp.</span>
          )}
        </div>
      </div>

      {/* ── Số lượng & Các nút Mua hàng ── */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">SỐ LƯỢNG:</span>
          <QuantityStepper value={qty} onChange={setQty} max={Math.max(max, 1)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => addToCart()}
            disabled={styleSoldOut || colorSoldOut}
            className="inline-flex h-12 w-full items-center justify-center gap-2 border-2 border-black bg-white px-6 text-xs font-bold uppercase tracking-wider text-black shadow-xs transition-colors hover:bg-black hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:border-[#e5e5e5] disabled:text-[#999999]"
          >
            <Bag className="h-4 w-4" />
            <span>{styleSoldOut || colorSoldOut ? "HẾT HÀNG" : "THÊM VÀO GIỎ"}</span>
          </button>

          <button
            type="button"
            onClick={buyNow}
            disabled={styleSoldOut || colorSoldOut || isBuying}
            className="inline-flex h-12 w-full items-center justify-center gap-2 bg-[#e60012] px-6 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-[#cc0010] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#e60012]/40"
          >
            {isBuying ? (
              <>
                <Spinner className="h-4 w-4 text-white" />
                <span>ĐANG XỬ LÝ…</span>
              </>
            ) : (
              <>
                <Bolt className="h-4 w-4 text-white" />
                <span>{styleSoldOut || colorSoldOut ? "HẾT HÀNG" : "MUA NGAY"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <p aria-live="polite" className="mt-3 text-xs font-bold text-[#e60012]">
          {error}
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-[#777777]">
        Không cần đăng ký tài khoản — giỏ hàng được lưu tự động trên thiết bị này.{" "}
        <Link href="/cart" className="font-bold text-black underline underline-offset-4 hover:text-[#e60012]">
          Xem giỏ hàng
        </Link>
      </p>

      {/* ── Modal Bảng Hướng Dẫn Chọn Size ── */}
      {showSizeGuide && <SizeGuideModal onClose={() => setShowSizeGuide(false)} />}
    </div>
  );
}


