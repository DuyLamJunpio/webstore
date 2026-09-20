import type { Metadata } from "next";
import Link from "next/link";
import CheckoutForm from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Thanh toán",
  description: "Nhập thông tin nhận hàng và thanh toán bằng chuyển khoản VietQR.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="shell pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-24">
      <nav aria-label="Đường dẫn" className="flex items-center gap-2 text-xs sm:text-[13px] text-muted">
        <Link href="/" className="transition-colors hover:text-ink">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/cart" className="transition-colors hover:text-ink">
          Giỏ hàng
        </Link>
        <span>/</span>
        <span className="font-semibold text-ink">Thanh toán</span>
      </nav>

      <h1 className="mt-4 font-sans text-[clamp(2rem,3.8vw,3.25rem)] font-black uppercase leading-[1.05] tracking-tight text-ink">
        THANH TOÁN ĐƠN HÀNG
      </h1>

      <CheckoutForm />
    </div>
  );
}
