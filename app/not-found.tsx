import Link from "next/link";
import { ArrowRight, HomeIcon, Store } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center text-center pt-28 sm:pt-32 lg:pt-36 pb-16">
      <span className="eyebrow rounded-full bg-gold/15 px-3.5 py-1 text-xs font-bold text-gold-deep">
        Lỗi 404
      </span>

      <h1 className="mt-4 font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.02em] text-ink">
        Không Tìm Thấy Trang
      </h1>

      <p className="measure mt-4 text-sm sm:text-base leading-relaxed text-muted max-w-md">
        Trang bạn đang tìm kiếm có thể đã được chuyển đổi, đổi tên hoặc tạm thời không khả dụng.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-cream shadow-sm transition-transform hover:scale-105 active:scale-95"
        >
          <HomeIcon className="h-4 w-4" />
          <span>Về trang chủ</span>
        </Link>
        <Link
          href="/shop"
          className="inline-flex h-12 items-center gap-2 rounded-full border border-line-strong bg-surface px-6 text-sm font-semibold text-ink shadow-xs transition-colors hover:border-ink active:scale-95"
        >
          <Store className="h-4 w-4" />
          <span>Xem cửa hàng</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted" />
        </Link>
      </div>
    </div>
  );
}
