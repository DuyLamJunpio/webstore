"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { defaultMethod, shippingFeeFor } from "@/lib/sales";
import { useSales } from "@/lib/sales-context";
import { formatPrice } from "@/lib/data";
import QuantityStepper from "../QuantityStepper";
import { ArrowRight } from "../icons";

export default function CartView() {
  const { items, count, subtotal, hydrated, clear, setQty, remove } = useCart();
  const sales = useSales();

  // giỏ hàng nằm trong localStorage nên phía server chưa có gì để dựng
  if (!hydrated) {
    return (
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-5">
          {[0, 1].map((row) => (
            <div key={row} className="flex gap-5 border-b border-line pb-5">
              <div className="aspect-square w-24 shrink-0 animate-pulse rounded-card bg-cream-dark" />
              <div className="flex-1 space-y-3 py-2">
                <div className="h-4 w-2/5 animate-pulse rounded bg-cream-dark" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-cream-dark" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-56 animate-pulse rounded-block bg-cream-dark" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-block border border-line bg-surface px-6 py-20 text-center">
        <p className="font-serif text-3xl font-medium">Giỏ hàng đang trống</p>
        <p className="measure mt-3 text-[15px] leading-relaxed text-muted">
          Chưa có gì ở đây. Mọi món bạn thêm sẽ được lưu trên thiết bị này trong 30 ngày — không cần
          tài khoản, không cần đăng nhập, và vẫn còn nguyên khi bạn quay lại.
        </p>
        <Link
          href="/shop"
          className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-7 text-sm font-medium text-cream transition-opacity hover:opacity-90"
        >
          Xem cửa hàng
          <ArrowRight />
        </Link>
      </div>
    );
  }

  // Phí giao hàng theo cài đặt bên quản trị, tính trên số món trong giỏ.
  const shipping = shippingFeeFor(sales, defaultMethod(sales), count);

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section aria-label="Sản phẩm trong giỏ">
        <ul>
          {items.map((line) => (
            <li key={line.id} className="flex gap-5 border-b border-line py-6 first:pt-0">
              <Link
                href={`/products/${line.slug}`}
                className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-card bg-surface ring-1 ring-line sm:w-28"
              >
                <Image src={line.image} alt={line.name} fill sizes="112px" className="object-cover" />
              </Link>

              <div className="flex flex-1 flex-col">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="line-clamp-2 text-[17px] font-medium leading-snug" title={line.name}>
                      <Link href={`/products/${line.slug}`}>{line.name}</Link>
                    </h2>
                    <p className="mt-1 text-[13px] text-muted">
                      {line.color} · Size {line.size}
                    </p>
                    <p className="mt-1 text-[13px] text-muted">{formatPrice(line.price)} mỗi sản phẩm</p>
                  </div>
                  <p className="text-[17px] font-medium">{formatPrice(line.price * line.qty)}</p>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-4 pt-4">
                  <QuantityStepper
                    size="sm"
                    value={line.qty}
                    max={line.stock}
                    onChange={(next) => setQty(line.id, next)}
                    label={`Số lượng của ${line.name}`}
                  />
                  {line.qty >= line.stock && (
                    <span className="text-[13px] text-muted">Đã đạt số lượng tồn kho</span>
                  )}
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

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/shop"
            className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-ink"
          >
            Tiếp tục mua sắm
          </Link>
          <button
            type="button"
            onClick={clear}
            className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-ink"
          >
            Xoá toàn bộ giỏ hàng
          </button>
        </div>
      </section>

      <aside className="lg:sticky lg:top-[92px] lg:self-start">
        <div className="rounded-block border border-line bg-surface p-6">
          <h2 className="eyebrow text-ink/60">Tóm tắt đơn hàng</h2>

          <dl className="mt-5 flex flex-col gap-3 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-muted">Tạm tính ({count} sản phẩm)</dt>
              <dd className="font-medium">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Phí giao hàng</dt>
              <dd className="font-medium">{shipping === 0 ? "Miễn phí" : formatPrice(shipping)}</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-4 text-lg">
              <dt className="font-medium">Tổng cộng</dt>
              <dd className="font-medium">{formatPrice(subtotal + shipping)}</dd>
            </div>
          </dl>

          <Link
            href="/checkout"
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-cream transition-opacity hover:opacity-90"
          >
            Thanh toán không cần tài khoản
            <ArrowRight />
          </Link>

          <p className="mt-4 text-[13px] leading-relaxed text-muted">
            Thanh toán bằng chuyển khoản VietQR — quét mã bằng ứng dụng ngân hàng, không cần đăng ký
            tài khoản. Giỏ hàng được lưu trên thiết bị này trong 30 ngày.
          </p>
        </div>
      </aside>
    </div>
  );
}
