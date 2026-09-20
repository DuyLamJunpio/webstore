"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { printDraftQty, usePrintDrafts } from "@/lib/print-draft";
import { Bag, HomeIcon, Sparkles, Store } from "./icons";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { count, hydrated, openCart } = useCart();
  const printDrafts = usePrintDrafts();
  const cartCount = hydrated ? count + printDraftQty(printDrafts) : 0;

  // Ẩn thanh bottom nav khi ở trang thanh toán hoặc trang chi tiết sản phẩm để nhường không gian cho thanh Mua hàng
  if (pathname.startsWith("/checkout") || pathname.startsWith("/products/")) {
    return null;
  }

  const isHome = pathname === "/";
  const isShop = pathname === "/shop";

  return (
    <nav
      aria-label="Điều hướng di động nhanh"
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-line bg-white/98 px-3 backdrop-blur-xl pb-safe lg:hidden transition-all duration-300 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
    >
      <Link
        href="/"
        className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors ${
          isHome ? "text-[#e60012] font-bold" : "text-muted hover:text-ink"
        }`}
      >
        <div className={`grid h-6 w-6 place-items-center transition-transform ${isHome ? "scale-105" : ""}`}>
          <HomeIcon className="h-5 w-5" />
        </div>
        <span>Trang chủ</span>
      </Link>

      <Link
        href="/shop"
        className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors ${
          isShop ? "text-[#e60012] font-bold" : "text-muted hover:text-ink"
        }`}
      >
        <div className={`grid h-6 w-6 place-items-center transition-transform ${isShop ? "scale-105" : ""}`}>
          <Store className="h-5 w-5" />
        </div>
        <span>Sản phẩm</span>
      </Link>

      <Link
        href="/shop?new=1"
        className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium text-muted transition-colors hover:text-[#e60012]"
      >
        <div className="grid h-6 w-6 place-items-center">
          <Sparkles className="h-5 w-5 text-[#e60012]" />
        </div>
        <span>Hàng mới</span>
      </Link>

      <button
        type="button"
        onClick={openCart}
        aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
        className="relative flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium text-muted transition-colors hover:text-ink"
      >
        <div className="relative grid h-6 w-6 place-items-center">
          <Bag className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center bg-[#e60012] px-1 text-[9px] font-bold text-white shadow-xs">
              {cartCount}
            </span>
          )}
        </div>
        <span>Giỏ hàng</span>
      </button>
    </nav>
  );
}
