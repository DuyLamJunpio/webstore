"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice, type Product } from "@/lib/data";
import { printDraftQty, usePrintDrafts } from "@/lib/print-draft";
import { useVariantSelection } from "@/lib/useVariantSelection";
import { Bag, Bolt, Spinner } from "../icons";

export default function StickyBuyBar({ product }: { product: Product }) {
  const [visible, setVisible] = useState(false);
  const { count, hydrated, openCart } = useCart();
  const printDrafts = usePrintDrafts();
  const {
    color,
    size,
    price,
    colorSoldOut,
    isBuying,
    addToCart,
    buyNow,
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

  const cartCount = hydrated ? count + printDraftQty(printDrafts) : 0;

  const handleAddToCart = () => {
    if (!color || !size) {
      document.getElementById("product-purchase-box")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    addToCart();
  };

  const handleBuyNow = () => {
    if (!color || !size) {
      document.getElementById("product-purchase-box")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    buyNow();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 lg:hidden z-40 border-t border-line bg-cream/95 px-3.5 pt-2.5 pb-safe backdrop-blur-xl shadow-[0_-6px_24px_rgba(0,0,0,0.08)] sheet-up">
      <div className="flex items-center gap-2">
        {/* Nút xem nhanh giỏ hàng */}
        <button
          type="button"
          onClick={openCart}
          aria-label="Mở giỏ hàng"
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-ink shadow-xs transition-transform active:scale-95"
        >
          <Bag className="h-4.5 w-4.5" />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] font-bold text-cream">
              {cartCount}
            </span>
          )}
        </button>

        {/* Nút Thêm vào giỏ */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={colorSoldOut}
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-ink bg-surface px-3 text-xs font-bold text-ink shadow-xs transition-transform active:scale-95 disabled:opacity-40"
        >
          <Bag className="h-3.5 w-3.5" />
          <span>{color && size ? "Thêm giỏ" : "Chọn size"}</span>
        </button>

        {/* Nút Mua ngay */}
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={colorSoldOut || isBuying}
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-ink px-3 text-xs font-bold text-cream shadow-md transition-transform active:scale-95 disabled:opacity-40"
        >
          {isBuying ? (
            <>
              <Spinner className="h-3.5 w-3.5 text-gold" />
              <span>Đang xử lý…</span>
            </>
          ) : (
            <>
              <Bolt className="h-3.5 w-3.5 text-gold" />
              <span>Mua ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
