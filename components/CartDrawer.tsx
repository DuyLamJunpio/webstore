"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { FREE_SHIPPING_THRESHOLD, useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/data";
import QuantityStepper from "./QuantityStepper";
import { Bag, Close } from "./icons";

export default function CartDrawer() {
  const { items, count, subtotal, isOpen, closeCart, setQty, remove } = useCart();

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

  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  return (
    <div className="fixed inset-0 z-70" role="dialog" aria-modal="true" aria-label="Giỏ hàng">
      <button
        type="button"
        aria-label="Đóng giỏ hàng"
        onClick={closeCart}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
      />

      <div className="absolute inset-y-0 right-0 flex w-[min(92vw,420px)] flex-col bg-cream shadow-2xl">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="text-lg font-medium">
            Giỏ hàng <span className="text-muted">({count} sản phẩm)</span>
          </p>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Đóng giỏ hàng"
            className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-ink/5"
          >
            <Close />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <Bag className="h-8 w-8 text-muted" />
            <p className="font-serif text-2xl font-medium">Giỏ hàng đang trống</p>
            <p className="text-sm leading-relaxed text-muted">
              Thêm một món và nó sẽ nằm lại đây — không cần tài khoản, không cần đăng nhập.
            </p>
            <Link
              href="/shop"
              onClick={closeCart}
              className="mt-2 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-cream transition-opacity hover:opacity-90"
            >
              Bắt đầu mua sắm
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-line px-5 py-4">
              <p className="text-[13px] text-muted">
                {remaining > 0 ? (
                  <>
                    Mua thêm <span className="font-medium text-ink">{formatPrice(remaining)}</span>{" "}
                    để được miễn phí giao hàng.
                  </>
                ) : (
                  <span className="font-medium text-ink">Bạn đã được miễn phí giao hàng.</span>
                )}
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <ul className="flex-1 overflow-y-auto px-5">
              {items.map((line) => (
                <li key={line.id} className="flex gap-4 border-b border-line py-5 last:border-none">
                  <Link
                    href={`/products/${line.slug}`}
                    onClick={closeCart}
                    className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-card bg-surface ring-1 ring-line"
                  >
                    <Image src={line.image} alt={line.name} fill sizes="80px" className="object-cover" />
                  </Link>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/products/${line.slug}`}
                          onClick={closeCart}
                          className="text-[15px] font-medium leading-snug"
                        >
                          {line.name}
                        </Link>
                        <p className="mt-1 text-[13px] text-muted">
                          {line.color} · {line.size}
                        </p>
                      </div>
                      <p className="shrink-0 text-[15px] font-medium">
                        {formatPrice(line.price * line.qty)}
                      </p>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-3">
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
                        className="text-[13px] text-muted underline underline-offset-4 transition-colors hover:text-ink"
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-line px-5 py-5">
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-muted">Tạm tính</p>
                <p className="text-lg font-medium">{formatPrice(subtotal)}</p>
              </div>
              <p className="mt-1 text-[13px] text-muted">
                Phí giao hàng và thuế được tính khi thanh toán.
              </p>

              <Link
                href="/cart"
                onClick={closeCart}
                className="mt-4 flex h-12 items-center justify-center rounded-full bg-ink text-sm font-medium text-cream transition-opacity hover:opacity-90"
              >
                Xem giỏ hàng & thanh toán
              </Link>
              <button
                type="button"
                onClick={closeCart}
                className="mt-2 h-11 w-full rounded-full border border-line-strong text-sm font-medium transition-colors hover:border-ink"
              >
                Tiếp tục mua sắm
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
