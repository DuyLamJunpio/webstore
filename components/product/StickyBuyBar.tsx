"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice, type Product } from "@/lib/data";
import { useVariantSelection } from "@/lib/useVariantSelection";
import { Bag } from "../icons";

export default function StickyBuyBar({ product }: { product: Product }) {
  const [visible, setVisible] = useState(false);
  const { count, hydrated, openCart } = useCart();
  const {
    color,
    size,
    price,
    colorSoldOut,
    addToCart,
  } = useVariantSelection(product);

  useEffect(() => {
    const onScroll = () => {
      const purchaseElem = document.getElementById("product-purchase-box");
      if (!purchaseElem) return;
      const rect = purchaseElem.getBoundingClientRect();
      setVisible(rect.bottom < 0);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  const handleBuy = () => {
    if (!color || !size) {
      document.getElementById("product-purchase-box")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    addToCart();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 lg:hidden z-40 border-t border-line bg-cream/95 px-4 pt-3 pb-safe backdrop-blur-xl shadow-[0_-6px_24px_rgba(0,0,0,0.08)] sheet-up">
      <div className="flex items-center justify-between gap-3">
        {/* Nút xem nhanh giỏ hàng */}
        <button
          type="button"
          onClick={openCart}
          aria-label="Mở giỏ hàng"
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-ink shadow-xs transition-transform active:scale-95"
        >
          <Bag className="h-5 w-5" />
          {hydrated && count > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] font-bold text-cream">
              {count}
            </span>
          )}
        </button>

        {/* Thông tin sản phẩm */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-ink truncate">{product.name}</p>
          <p className="text-xs font-bold text-gold-deep">{formatPrice(price)}</p>
        </div>

        {/* Nút Thêm vào giỏ */}
        <button
          type="button"
          onClick={handleBuy}
          disabled={colorSoldOut}
          className="inline-flex h-11 flex-1 max-w-[180px] items-center justify-center gap-1.5 rounded-full bg-ink px-4 text-xs font-bold text-cream shadow-md transition-transform active:scale-95 disabled:opacity-40"
        >
          <Bag className="h-4 w-4" />
          <span>{color && size ? "Thêm vào giỏ" : "Chọn size & mua"}</span>
        </button>
      </div>
    </div>
  );
}

