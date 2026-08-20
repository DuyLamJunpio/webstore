"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { Bag, HomeIcon, Sparkles, Store } from "./icons";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { count, hydrated, openCart } = useCart();

  // Ẩn thanh bottom nav khi ở trang thanh toán hoặc trang chi tiết sản phẩm để nhường không gian cho thanh Mua hàng
  if (pathname.startsWith("/checkout") || pathname.startsWith("/products/")) {
    return null;
  }

  const isHome = pathname === "/";
  const isShop = pathname === "/shop";

  return (
    <nav
      aria-label="Điều hướng di động nhanh"
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-line bg-cream/90 px-3 backdrop-blur-xl pb-safe lg:hidden transition-all duration-300 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]"
    >
      <Link
        href="/"
        className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors ${
          isHome ? "text-ink font-semibold" : "text-muted hover:text-ink"
        }`}
      >
        <div className={`grid h-6 w-6 place-items-center rounded-full transition-transform ${isHome ? "scale-110" : ""}`}>
          <HomeIcon className="h-5 w-5" />
        </div>
        <span>Trang chủ</span>
      </Link>

      <Link
        href="/shop"
        className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors ${
          isShop ? "text-ink font-semibold" : "text-muted hover:text-ink"
        }`}
      >
        <div className={`grid h-6 w-6 place-items-center rounded-full transition-transform ${isShop ? "scale-110" : ""}`}>
          <Store className="h-5 w-5" />
        </div>
        <span>Cửa hàng</span>
      </Link>

      <Link
        href="/shop?new=1"
        className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium text-muted transition-colors hover:text-ink"
      >
        <div className="grid h-6 w-6 place-items-center rounded-full">
          <Sparkles className="h-5 w-5 text-gold" />
        </div>
        <span>Hàng mới</span>
      </Link>

      <button
        type="button"
        onClick={openCart}
        aria-label={`Giỏ hàng, ${hydrated ? count : 0} sản phẩm`}
        className="relative flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium text-muted transition-colors hover:text-ink"
      >
        <div className="relative grid h-6 w-6 place-items-center rounded-full">
          <Bag className="h-5 w-5" />
          {hydrated && count > 0 && (
            <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] font-bold text-cream">
              {count}
            </span>
          )}
        </div>
        <span>Giỏ hàng</span>
      </button>
    </nav>
  );
}
