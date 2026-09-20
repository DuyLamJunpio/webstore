"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { printDraftQty, usePrintDrafts } from "@/lib/print-draft";
import { Bag, Bolt, Spinner } from "../icons";
import { useSharedVariantSelection } from "./VariantSelectionProvider";

export default function StickyBuyBar() {
  const [visible, setVisible] = useState(false);
  const { count, hydrated, openCart } = useCart();
  const printDrafts = usePrintDrafts();
  const {
    color,
    size,
    styleSoldOut,
    colorSoldOut,
    isBuying,
    addToCart,
    buyNow,
  } = useSharedVariantSelection();

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
    <div className="fixed inset-x-0 bottom-0 lg:hidden z-40 border-t border-[#e5e5e5] bg-white/95 px-3.5 pt-2.5 pb-safe backdrop-blur-xl shadow-[0_-4px_16px_rgba(0,0,0,0.08)] sheet-up">
      <div className="flex items-center gap-2">
        {/* Nút xem nhanh giỏ hàng */}
        <button
          type="button"
          onClick={openCart}
          aria-label="Mở giỏ hàng"
          className="relative grid h-10 w-10 shrink-0 place-items-center border border-black/30 bg-white text-ink shadow-xs transition-colors hover:border-black active:scale-95"
        >
          <Bag className="h-4 w-4" />
          {cartCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center bg-[#e60012] px-1 text-[9px] font-black text-white">
              {cartCount}
            </span>
          )}
        </button>

        {/* Nút Thêm vào giỏ */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={styleSoldOut || colorSoldOut}
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 border border-black bg-white px-3 text-xs font-bold uppercase tracking-wider text-black shadow-xs transition-colors hover:bg-black hover:text-white active:scale-95 disabled:opacity-40"
        >
          <Bag className="h-3.5 w-3.5" />
          <span>{color && size ? "Thêm giỏ" : "Chọn size"}</span>
        </button>

        {/* Nút Mua ngay */}
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={styleSoldOut || colorSoldOut || isBuying}
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 bg-[#e60012] px-3 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-[#cc0010] active:scale-95 disabled:opacity-40"
        >
          {isBuying ? (
            <>
              <Spinner className="h-3.5 w-3.5 text-white" />
              <span>Đang xử lý…</span>
            </>
          ) : (
            <>
              <Bolt className="h-3.5 w-3.5 text-white" />
              <span>Mua ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
