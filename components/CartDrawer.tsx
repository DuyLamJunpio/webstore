"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { defaultMethod, itemsToFreeShipping } from "@/lib/sales";
import { useSales } from "@/lib/sales-context";
import { formatPrice } from "@/lib/data";
import {
  printDraftQty,
  printDraftTotal,
  removePrintDraft,
  usePrintDrafts,
} from "@/lib/print-draft";
import QuantityStepper from "./QuantityStepper";
import { Bag, Close, Sparkles } from "./icons";

export default function CartDrawer() {
  const { items, count, subtotal, isOpen, closeCart, setQty, remove } = useCart();
  const sales = useSales();
  const printDrafts = usePrintDrafts();
  const hasPrint = printDrafts.length > 0;
  const printQty = printDraftQty(printDrafts);
  const totalCount = count + printQty;
  const totalSubtotal = subtotal + printDraftTotal(printDrafts);
  const PHUONG_THUC = defaultMethod(sales, { hasPrint });

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const nguong = sales[PHUONG_THUC].freeShippingMinItems;
  const conThieu = itemsToFreeShipping(sales, PHUONG_THUC, totalCount);
  const hienThanhMienPhi = !sales[PHUONG_THUC].freeShipping && nguong !== null;
  const progress = nguong ? Math.min((totalCount / nguong) * 100, 100) : 100;
  const hasItems = items.length > 0 || hasPrint;

  return (
    <div className="fixed inset-0 z-70" role="dialog" aria-modal="true" aria-label="Giỏ hàng">
      <button
        type="button"
        aria-label="Đóng giỏ hàng"
        onClick={closeCart}
        className="absolute inset-0 bg-ink/50 backdrop-blur-xs fade-in"
      />

      <div className="absolute inset-y-0 right-0 flex w-[min(94vw,440px)] flex-col bg-white shadow-2xl transition-transform duration-300">
        <header className="flex items-center justify-between border-b border-[#e5e5e5] px-5 py-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black uppercase tracking-wider text-ink">GIỎ HÀNG</p>
            <span className="bg-[#8f633e] px-2 py-0.5 text-xs font-black text-white">
              {totalCount}
            </span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Đóng giỏ hàng"
            className="grid h-8 w-8 place-items-center text-ink transition-colors hover:bg-black/5"
          >
            <Close className="h-4 w-4" />
          </button>
        </header>

        {!hasItems ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="grid h-16 w-16 place-items-center border border-[#e5e5e5] bg-[#f7f7f7] shadow-xs">
              <Bag className="h-7 w-7 text-[#777777]" />
            </div>
            <p className="font-sans text-xl font-black uppercase text-ink">Giỏ hàng đang trống</p>
            <p className="text-xs sm:text-sm leading-relaxed text-[#777777] max-w-xs">
              Thêm một món đồ LifeWear yêu thích và nó sẽ nằm lại đây mà không cần đăng nhập.
            </p>
            <Link
              href="/shop"
              onClick={closeCart}
              className="mt-2 inline-flex h-11 items-center bg-black px-8 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-[#8f633e]"
            >
              BẮT ĐẦU MUA SẮM
            </Link>
          </div>
        ) : (
          <>
            {/* ── Tiến trình freeship ── */}
            {hienThanhMienPhi && (
              <div className="border-b border-[#e5e5e5] bg-[#f7f7f7] px-5 py-3.5">
                <div className="flex items-center justify-between text-xs">
                  {conThieu > 0 ? (
                    <p className="text-[#555555]">
                      Mua thêm <strong className="text-ink font-black">{conThieu} sản phẩm</strong> để nhận Freeship.
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 font-bold text-[#8f633e]">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>ĐÃ ĐẠT TIÊU CHUẨN FREESHIP!</span>
                    </p>
                  )}
                  <span className="text-xs font-black text-ink">{Math.round(progress)}%</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden bg-[#e5e5e5]">
                  <div
                    className="h-full bg-[#8f633e] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* ── Danh sách sản phẩm ── */}
            <ul className="flex-1 overflow-y-auto px-5 divide-y divide-[#e5e5e5]">
              {items.map((line) => (
                <li key={line.id} className="flex gap-3.5 py-4">
                  <Link
                    href={`/products/${line.slug}`}
                    onClick={closeCart}
                    className="relative aspect-square w-20 shrink-0 overflow-hidden border border-[#e5e5e5] bg-white shadow-xs"
                  >
                    <Image src={line.image} alt={line.name} fill sizes="80px" className="object-cover" />
                  </Link>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${line.slug}`}
                          onClick={closeCart}
                          className="line-clamp-2 text-xs sm:text-sm font-bold leading-snug text-ink hover:text-[#8f633e] transition-colors"
                          title={line.name}
                        >
                          {line.name}
                        </Link>
                        <p className="shrink-0 text-xs sm:text-sm font-black text-ink">
                          {formatPrice(line.price * line.qty)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-[#777777]">
                        {[line.styleName, line.color, `Size ${line.size}`].filter(Boolean).join(" · ")}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <QuantityStepper
                        size="sm"
                        value={line.qty}
                        max={line.stock}
                        onChange={(next) => setQty(line.id, next)}
                        label={`Số lượng của ${line.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => remove(line.id)}
                        className="text-xs text-[#777777] hover:text-[#8f633e] underline underline-offset-4 transition-colors"
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                </li>
              ))}

              {printDrafts.map((printDraft) => (
                <li key={printDraft.code} className="flex gap-3.5 py-4">
                  <div className="relative grid aspect-square w-20 shrink-0 place-items-center overflow-hidden border border-[#e5e5e5] bg-white shadow-xs">
                    {printDraft.thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={printDraft.thumbUrl}
                        alt={printDraft.label}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <Bag className="h-6 w-6 text-ink" />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-xs sm:text-sm font-bold leading-snug text-ink">
                            Áo in theo yêu cầu (UTme!)
                          </p>
                          <p className="mt-1 text-xs text-[#777777]">{printDraft.label}</p>
                        </div>
                        <p className="shrink-0 text-xs sm:text-sm font-black text-ink">
                          {formatPrice(printDraft.total)}
                        </p>
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-[#8f633e]">
                        {printDraft.code} · {printDraft.qty} áo · giao sau {printDraft.leadDays} ngày
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="border border-[#e5e5e5] bg-white px-2.5 py-0.5 text-xs font-bold text-ink">
                        SL {printDraft.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePrintDraft(printDraft.code)}
                        className="text-xs text-[#777777] underline underline-offset-4 transition-colors hover:text-[#8f633e]"
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* ── Footer ── */}
            <footer className="border-t border-[#e5e5e5] bg-[#f7f7f7] px-5 py-4 pb-safe shadow-sm">
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[#777777]">TẠM TÍNH</p>
                <p className="text-lg font-black text-ink">{formatPrice(totalSubtotal)}</p>
              </div>
              <p className="mt-0.5 text-[11px] text-[#777777]">
                Phí vận chuyển và coupon giảm giá sẽ được áp dụng ở bước thanh toán.
              </p>

              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="flex h-12 items-center justify-center bg-[#8f633e] text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-[#734d2c]"
                >
                  THANH TOÁN ĐƠN HÀNG
                </Link>
                <button
                  type="button"
                  onClick={closeCart}
                  className="h-10 w-full border border-black bg-white text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-black hover:text-white"
                >
                  TIẾP TỤC MUA SẮM
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
