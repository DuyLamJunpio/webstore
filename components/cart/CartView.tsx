"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { defaultMethod, shippingFeeFor } from "@/lib/sales";
import { useSales } from "@/lib/sales-context";
import { formatPrice } from "@/lib/data";
import {
  clearPrintDrafts,
  printDraftQty,
  printDraftTotal,
  removePrintDraft,
  usePrintDrafts,
} from "@/lib/print-draft";
import QuantityStepper from "../QuantityStepper";
import { ArrowRight, Bag } from "../icons";

export default function CartView() {
  const { items, count, subtotal, hydrated, clear, setQty, remove } = useCart();
  const sales = useSales();
  const printDrafts = usePrintDrafts();

  if (!hydrated) {
    return (
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          {[0, 1].map((row) => (
            <div key={row} className="flex gap-4 border-b border-line pb-4">
              <div className="aspect-square w-24 shrink-0 skeleton rounded-card" />
              <div className="flex-1 space-y-2.5 py-2">
                <div className="h-4 w-2/5 skeleton rounded" />
                <div className="h-3 w-1/4 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-64 skeleton rounded-block" />
      </div>
    );
  }

  const hasPrint = printDrafts.length > 0;
  const printQty = printDraftQty(printDrafts);
  const printTotal = printDraftTotal(printDrafts);
  const totalCount = count + printQty;
  const totalSubtotal = subtotal + printTotal;

  if (items.length === 0 && !hasPrint) {
    return (
      <div className="mt-8 rounded-block border border-line bg-surface px-6 py-16 text-center shadow-xs">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cream ring-1 ring-line text-muted">
          <Bag className="h-7 w-7" />
        </div>
        <p className="mt-4 font-serif text-2xl sm:text-3xl font-semibold text-ink">Giỏ hàng đang trống</p>
        <p className="measure mt-3 text-sm sm:text-[15px] leading-relaxed text-muted">
          Chưa có sản phẩm nào trong giỏ. Các món bạn thêm sẽ được tự động lưu lại trên trình duyệt của bạn.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-7 text-sm font-semibold text-cream shadow-xs transition-transform hover:scale-105 active:scale-95"
        >
          <span>Khám phá sản phẩm</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const shipping = shippingFeeFor(sales, defaultMethod(sales, { hasPrint }), totalCount);
  const clearAll = () => {
    clear();
    clearPrintDrafts();
  };

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section aria-label="Sản phẩm trong giỏ">
        <ul className="divide-y divide-line border-b border-line">
          {items.map((line) => (
            <li key={line.id} className="flex gap-4 py-5 first:pt-0">
              <Link
                href={`/products/${line.slug}`}
                className="relative aspect-square w-24 sm:w-28 shrink-0 overflow-hidden rounded-card bg-surface ring-1 ring-line shadow-xs"
              >
                <Image src={line.image} alt={line.name} fill sizes="112px" className="object-cover" />
              </Link>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="line-clamp-2 text-sm sm:text-base font-semibold leading-snug text-ink hover:text-gold-deep transition-colors" title={line.name}>
                      <Link href={`/products/${line.slug}`}>{line.name}</Link>
                    </h2>
                    <p className="text-sm sm:text-base font-bold text-ink">{formatPrice(line.price * line.qty)}</p>
                  </div>
                  <p className="mt-1 text-xs sm:text-[13px] text-muted">
                    {line.color} · Size {line.size} · {formatPrice(line.price)}/sp
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <QuantityStepper
                    size="sm"
                    value={line.qty}
                    max={line.stock}
                    onChange={(next) => setQty(line.id, next)}
                    label={`Số lượng của ${line.name}`}
                  />
                  {line.qty >= line.stock && (
                    <span className="text-xs text-gold-deep font-semibold">Tối đa tồn kho</span>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(line.id)}
                    className="text-xs text-muted underline underline-offset-4 transition-colors hover:text-ink"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            </li>
          ))}

          {printDrafts.map((printDraft) => (
            <li key={printDraft.code} className="flex gap-4 py-5 first:pt-0">
              <div className="relative grid aspect-square w-24 shrink-0 place-items-center overflow-hidden rounded-card bg-gold/8 ring-1 ring-gold-soft shadow-xs sm:w-28">
                {printDraft.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={printDraft.thumbUrl}
                    alt=""
                    className="h-full w-full object-contain p-3"
                  />
                ) : (
                  <Bag className="h-8 w-8 text-gold-deep" />
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold leading-snug text-ink sm:text-base">
                        Áo in theo yêu cầu
                      </h2>
                      <p className="mt-1 text-xs text-muted sm:text-[13px]">{printDraft.label}</p>
                    </div>
                    <p className="text-sm font-bold text-ink sm:text-base">
                      {formatPrice(printDraft.total)}
                    </p>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-gold-deep">
                    {printDraft.code} · {printDraft.qty} áo · {formatPrice(printDraft.unitPrice)}/áo
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-ink ring-1 ring-line">
                    Giao sau {printDraft.leadDays} ngày
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

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/shop"
            className="text-xs sm:text-sm text-muted underline underline-offset-4 transition-colors hover:text-ink"
          >
            ← Tiếp tục mua sắm
          </Link>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs sm:text-sm text-muted underline underline-offset-4 transition-colors hover:text-ink"
          >
            Xoá toàn bộ giỏ hàng
          </button>
        </div>
      </section>

      {/* ── Order Summary ── */}
      <aside className="lg:sticky lg:top-[92px] lg:self-start">
        <div className="rounded-block border border-line bg-surface p-6 shadow-sm">
          <h2 className="eyebrow font-bold text-ink">Tóm tắt đơn hàng</h2>

          <dl className="mt-5 flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Tạm tính ({totalCount} món)</dt>
              <dd className="font-semibold text-ink">{formatPrice(totalSubtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Phí giao hàng</dt>
              <dd className="font-semibold text-ink">
                {shipping === 0 ? (
                  <span className="text-gold-deep font-bold">Miễn phí</span>
                ) : (
                  formatPrice(shipping)
                )}
              </dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-4 text-base sm:text-lg">
              <dt className="font-bold text-ink">Tổng cộng</dt>
              <dd className="font-bold text-ink">{formatPrice(totalSubtotal + shipping)}</dd>
            </div>
          </dl>

          <Link
            href="/checkout"
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-cream shadow-sm transition-transform hover:scale-102 active:scale-98"
          >
            <span>Tiến hành đặt hàng</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="mt-5 rounded-xl bg-cream/70 p-3.5 text-xs leading-relaxed text-muted border border-line/60">
            🔒 Thanh toán bảo mật bằng chuyển khoản VietQR hoặc thẻ qua PayOS. Không cần tạo tài khoản.
          </div>
        </div>
      </aside>
    </div>
  );
}
