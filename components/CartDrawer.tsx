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

      <div className="absolute inset-y-0 right-0 flex w-[min(94vw,440px)] flex-col bg-cream shadow-2xl transition-transform duration-300">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold text-ink">Giỏ hàng</p>
            <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-cream">
              {totalCount}
            </span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Đóng giỏ hàng"
            className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <Close />
          </button>
        </header>

        {!hasItems ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-surface shadow-xs ring-1 ring-line">
              <Bag className="h-7 w-7 text-muted" />
            </div>
            <p className="font-serif text-2xl font-semibold text-ink">Giỏ hàng đang trống</p>
            <p className="text-xs sm:text-sm leading-relaxed text-muted max-w-xs">
              Thêm một món yêu thích và nó sẽ nằm lại đây mà không cần đăng nhập.
            </p>
            <Link
              href="/shop"
              onClick={closeCart}
              className="mt-2 inline-flex h-11 items-center rounded-full bg-ink px-7 text-sm font-semibold text-cream shadow-xs transition-transform hover:scale-105 active:scale-95"
            >
              Bắt đầu mua sắm
            </Link>
          </div>
        ) : (
          <>
            {/* ── Tiến trình freeship ── */}
            {hienThanhMienPhi && (
              <div className="border-b border-line bg-surface/50 px-5 py-3.5">
                <div className="flex items-center justify-between text-xs sm:text-[13px]">
                  {conThieu > 0 ? (
                    <p className="text-muted">
                      Mua thêm <strong className="text-ink font-semibold">{conThieu} sản phẩm</strong> để nhận Freeship.
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 font-semibold text-gold-deep">
                      <Sparkles className="h-4 w-4" />
                      <span>Đã đạt Freeship toàn quốc!</span>
                    </p>
                  )}
                  <span className="text-xs font-bold text-muted">{Math.round(progress)}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line-strong/40">
                  <div
                    className="h-full rounded-full bg-gold transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* ── Danh sách sản phẩm ── */}
            <ul className="flex-1 overflow-y-auto px-5 divide-y divide-line">
              {items.map((line) => (
                <li key={line.id} className="flex gap-3.5 py-4">
                  <Link
                    href={`/products/${line.slug}`}
                    onClick={closeCart}
                    className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-card bg-surface ring-1 ring-line shadow-xs"
                  >
                    <Image src={line.image} alt={line.name} fill sizes="80px" className="object-cover" />
                  </Link>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${line.slug}`}
                          onClick={closeCart}
                          className="line-clamp-2 text-sm font-semibold leading-snug text-ink hover:text-gold-deep transition-colors"
                          title={line.name}
                        >
                          {line.name}
                        </Link>
                        <p className="shrink-0 text-sm font-bold text-ink">
                          {formatPrice(line.price * line.qty)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {line.color} · Size {line.size}
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
                        className="text-xs text-muted hover:text-ink underline underline-offset-4 transition-colors"
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                </li>
              ))}

              {printDrafts.map((printDraft) => (
                <li key={printDraft.code} className="flex gap-3.5 py-4">
                  <div className="relative grid aspect-square w-20 shrink-0 place-items-center overflow-hidden rounded-card bg-gold/8 ring-1 ring-gold-soft shadow-xs">
                    {printDraft.thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={printDraft.thumbUrl}
                        alt=""
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <Bag className="h-7 w-7 text-gold-deep" />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
                            Áo in theo yêu cầu
                          </p>
                          <p className="mt-1 text-xs text-muted">{printDraft.label}</p>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-ink">
                          {formatPrice(printDraft.total)}
                        </p>
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-gold-deep">
                        {printDraft.code} · {printDraft.qty} áo · giao sau {printDraft.leadDays} ngày
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink ring-1 ring-line">
                        SL {printDraft.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePrintDraft(printDraft.code)}
                        className="text-xs text-muted underline underline-offset-4 transition-colors hover:text-ink"
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* ── Footer ── */}
            <footer className="border-t border-line bg-surface/40 px-5 py-4 pb-safe shadow-sm">
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-muted">Tạm tính</p>
                <p className="text-lg font-bold text-ink">{formatPrice(totalSubtotal)}</p>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                Phí giao hàng được tính khi thanh toán.
              </p>

              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="flex h-12 items-center justify-center rounded-full bg-ink text-sm font-semibold text-cream shadow-sm transition-all hover:bg-ink-soft hover:scale-[1.01] active:scale-[0.98]"
                >
                  Xem giỏ hàng & thanh toán
                </Link>
                <button
                  type="button"
                  onClick={closeCart}
                  className="h-10 w-full rounded-full border border-line-strong bg-surface text-xs font-semibold text-ink transition-colors hover:border-ink"
                >
                  Tiếp tục xem sản phẩm
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
