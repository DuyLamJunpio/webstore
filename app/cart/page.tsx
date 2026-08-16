import type { Metadata } from "next";
import Link from "next/link";
import CartView from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Giỏ hàng",
  description: "Xem lại giỏ hàng và thanh toán không cần tài khoản.",
};

export default function CartPage() {
  return (
    <div className="shell section">
      <nav aria-label="Đường dẫn" className="text-[13px] text-muted">
        <Link href="/" className="transition-colors hover:text-ink">
          Trang chủ
        </Link>
        <span className="px-2">/</span>
        <span className="text-ink">Giỏ hàng</span>
      </nav>

      <h1 className="mt-4 font-serif text-[clamp(2.25rem,4vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.015em]">
        Giỏ Hàng Của Bạn
      </h1>

      <CartView />
    </div>
  );
}
