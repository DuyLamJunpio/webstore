"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  EMPTY_CUSTOMER,
  validateCustomer,
  type CustomerErrors,
  type CustomerField,
  type CustomerInfo,
} from "@/lib/checkout";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/data";
import {
  defaultMethod,
  enabledMethods,
  itemsToFreeShipping,
  shippingFeeFor,
  MO_TA_PHUONG_THUC,
  NHAN_NUT_DANG_GUI,
  NHAN_NUT_DAT,
  TEN_PHUONG_THUC,
  type PaymentMethodKey,
} from "@/lib/sales";
import { useSales } from "@/lib/sales-context";
import { ArrowRight } from "../icons";

/** the shop has no accounts, so the last address typed is the only "profile" there is */
const DRAFT_KEY = "tbc.checkout.v1";

function readDraft(): CustomerInfo {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return EMPTY_CUSTOMER;
    const parsed = JSON.parse(raw) as Partial<CustomerInfo>;
    return { ...EMPTY_CUSTOMER, ...parsed, note: "" };
  } catch {
    return EMPTY_CUSTOMER;
  }
}

type FieldProps = {
  name: CustomerField;
  label: string;
  value: string;
  error?: string;
  optional?: boolean;
  /** câu giải thích ngắn dưới ô nhập — nhường chỗ cho lỗi khi có lỗi */
  hint?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  multiline?: boolean;
  onChange: (name: CustomerField, value: string) => void;
};

function Field({
  name,
  label,
  value,
  error,
  optional,
  hint,
  type = "text",
  autoComplete,
  placeholder,
  multiline,
  onChange,
}: FieldProps) {
  const id = useId();
  const shared = {
    id,
    name,
    value,
    placeholder,
    autoComplete,
    "aria-invalid": error ? true : undefined,
    // trỏ sang cả khi chỉ có gợi ý: người dùng trình đọc màn hình cũng cần biết
    // vì sao ô này cần điền, không riêng lúc đã gõ sai
    "aria-describedby": error || hint ? `${id}-error` : undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(name, event.target.value),
    className: `w-full rounded-card border bg-surface px-4 text-[15px] outline-none transition-colors placeholder:text-muted/60 focus:border-ink ${
      error ? "border-gold-deep" : "border-line-strong"
    }`,
  };

  return (
    <div className={multiline ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium">
        {label}
        {optional && <span className="ml-1.5 font-normal text-muted">(tuỳ chọn)</span>}
      </label>
      {multiline ? (
        <textarea {...shared} rows={3} className={`${shared.className} py-3 leading-relaxed`} />
      ) : (
        <input {...shared} type={type} className={`${shared.className} h-12`} />
      )}
      {/* một dòng dùng chung: có lỗi thì báo lỗi, không thì nhắc nhẹ vì sao cần ô này */}
      <p
        id={`${id}-error`}
        className={`mt-1.5 min-h-4 text-[12px] ${error ? "text-gold-deep" : "text-muted"}`}
      >
        {error || hint}
      </p>
    </div>
  );
}

export default function CheckoutForm() {
  const { items, count, subtotal, hydrated } = useCart();

  // giỏ hàng nằm trong localStorage nên phía server chưa có gì để dựng
  if (!hydrated) {
    return (
      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="h-96 animate-pulse rounded-block bg-cream-dark" />
        <div className="h-72 animate-pulse rounded-block bg-cream-dark" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-block border border-line bg-surface px-6 py-20 text-center">
        <p className="font-serif text-3xl font-medium">Chưa có gì để thanh toán</p>
        <p className="measure mt-3 text-[15px] leading-relaxed text-muted">
          Giỏ hàng của bạn đang trống. Chọn vài món trước rồi quay lại đây nhé.
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

  return <CheckoutFields items={items} count={count} subtotal={subtotal} />;
}

/**
 * Only mounted once the cart has hydrated, which is what makes it safe to seed
 * the fields straight from localStorage: this never renders on the server, so
 * there is no markup for the remembered address to disagree with.
 */
function CheckoutFields({
  items,
  count,
  subtotal,
}: Pick<ReturnType<typeof useCart>, "items" | "count" | "subtotal">) {
  const sales = useSales();
  const [method, setMethod] = useState<PaymentMethodKey>(() => defaultMethod(sales));
  const router = useRouter();

  const [customer, setCustomer] = useState<CustomerInfo>(readDraft);
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [formError, setFormError] = useState("");
  // Nhớ đang gửi bằng hình thức nào để chỉ khoá đúng nút khách vừa bấm.
  const [dangGui, setDangGui] = useState<PaymentMethodKey | null>(null);
  const submitting = dangGui !== null;

  const update = (name: CustomerField, value: string) => {
    setCustomer((current) => ({ ...current, [name]: value }));
    // clear a field's complaint as soon as the shopper starts fixing it
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  };

  /**
   * Đặt hàng bằng một hình thức cụ thể.
   *
   * Hai nút gọi cùng hàm này, chỉ khác mã hình thức gửi lên: chuyển khoản đi
   * tiếp sang trang mã QR, còn trả khi nhận hàng thì đơn chốt luôn tại đây.
   */
  async function datHang(method: PaymentMethodKey) {
    if (submitting) return;
    setFormError("");

    const found = validateCustomer(customer);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }

    setDangGui(method);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // only ids and quantities — the server prices the order itself
          lines: items.map((line) => ({ id: line.id, qty: line.qty })),
          customer,
          paymentMethod: method,
        }),
      });
      // Máy chủ lỗi nặng thì phần thân là trang HTML, không phải JSON. Để json()
      // ném ở đây là rơi vào nhánh bắt lỗi cuối cùng và khách đọc được đúng một
      // câu sai sự thật: "mất kết nối".
      const payload = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        fieldErrors?: CustomerErrors;
      };

      if (!response.ok || !payload.url) {
        setErrors(payload.fieldErrors ?? {});
        setFormError(
          payload.error ??
            `Không tạo được đơn hàng (lỗi ${response.status}). Vui lòng thử lại hoặc liên hệ shop.`,
        );
        return;
      }

      try {
        const { note, ...reusable } = customer;
        void note; // a note belongs to one order, not to the next one
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(reusable));
      } catch {
        // private mode — the address just will not be remembered
      }

      router.push(payload.url);
    } catch {
      setFormError("Mất kết nối. Vui lòng kiểm tra mạng và thử lại.");
    } finally {
      setDangGui(null);
    }
  }

  /**
   * Phí giao hàng do chủ shop khai trong trang quản trị, RIÊNG cho từng hình thức
   * thanh toán: mỗi hình thức có mức phí, người trả phí (khách hay shop) và ngưỡng
   * miễn phí theo số món của nó. Ở đây chỉ đọc kết quả — cùng phép tính máy chủ
   * chạy lại lúc đặt hàng, nên con số khách thấy chính là con số ghi vào đơn.
   *
   * Hai hình thức có thể ra hai mức phí khác nhau, nên tính sẵn cả hai: bảng tổng
   * kết theo hình thức của nút chính, còn nút kia tự nói mức của mình.
   */
  const cachChon = enabledMethods(sales);

  // Phí giao hàng, ngưỡng miễn phí và tổng tiền đều tính theo hình thức khách
  // đang chọn: chủ shop khai riêng từng hình thức bên trang quản trị, nên hai
  // cách trả tiền có thể ra hai con số khác nhau cho cùng một giỏ.
  const shipping = shippingFeeFor(sales, method, count);
  const conThieuDeMienPhi = itemsToFreeShipping(sales, method, count);
  const total = subtotal + shipping;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        // Bấm Enter trong ô nhập = bấm nút chính.
        void datHang(method);
      }}
      noValidate className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section>
        <h2 className="eyebrow text-ink/60">Thông tin nhận hàng</h2>
        <p className="mt-2 text-[13px] text-muted">
          Không cần tài khoản — chúng tôi chỉ dùng những thông tin này để giao đơn hàng.
        </p>

        <div className="mt-6 grid gap-x-5 sm:grid-cols-2">
          <Field
            name="fullName"
            label="Họ và tên"
            value={customer.fullName}
            error={errors.fullName}
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            onChange={update}
          />
          <Field
            name="phone"
            label="Số điện thoại"
            value={customer.phone}
            error={errors.phone}
            type="tel"
            autoComplete="tel"
            placeholder="0901 234 567"
            onChange={update}
          />
          <Field
            name="email"
            label="Email"
            value={customer.email}
            error={errors.email}
            hint="Chúng tôi gửi xác nhận đơn hàng về đây"
            type="email"
            autoComplete="email"
            placeholder="ban@email.com"
            onChange={update}
          />
          <Field
            name="city"
            label="Tỉnh / Thành phố"
            value={customer.city}
            error={errors.city}
            autoComplete="address-level1"
            placeholder="TP. Hồ Chí Minh"
            onChange={update}
          />
          <Field
            name="ward"
            label="Phường / Xã"
            value={customer.ward}
            error={errors.ward}
            autoComplete="address-level2"
            placeholder="Phường Bến Nghé"
            onChange={update}
          />
          <Field
            name="address"
            label="Địa chỉ"
            value={customer.address}
            error={errors.address}
            autoComplete="street-address"
            placeholder="Số nhà, tên đường"
            onChange={update}
          />
          <Field
            name="note"
            label="Ghi chú cho đơn hàng"
            value={customer.note}
            error={errors.note}
            optional
            multiline
            placeholder="Giao giờ hành chính, gọi trước khi tới…"
            onChange={update}
          />
        </div>

      </section>

      <aside className="lg:sticky lg:top-[92px] lg:self-start">
        <div className="rounded-block border border-line bg-surface p-6">
          <h2 className="eyebrow text-ink/60">Đơn hàng ({count} sản phẩm)</h2>

          <ul className="mt-5 flex flex-col gap-4">
            {items.map((line) => (
              <li key={line.id} className="flex gap-3">
                <div className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-card bg-cream ring-1 ring-line">
                  <Image src={line.image} alt="" fill sizes="56px" className="object-cover" />
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] font-medium text-cream">
                    {line.qty}
                  </span>
                </div>
                <div className="flex flex-1 items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-medium leading-snug">{line.name}</p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {line.color} · {line.size}
                    </p>
                  </div>
                  <p className="shrink-0 text-[14px] font-medium">
                    {formatPrice(line.price * line.qty)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-6 flex flex-col gap-3 border-t border-line pt-5 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-muted">Tạm tính</dt>
              <dd className="font-medium">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Phí giao hàng</dt>
              <dd className="font-medium">{shipping === 0 ? "Miễn phí" : formatPrice(shipping)}</dd>
            </div>
            {/* Nói rõ vì sao ra con số đó: ngưỡng miễn phí là thứ chủ shop khai
                bên quản trị, khách không có cách nào đoán được. */}
            {conThieuDeMienPhi > 0 && (
              <p className="-mt-1 text-[13px] text-muted">
                Mua thêm {conThieuDeMienPhi} sản phẩm để được miễn phí giao hàng.
              </p>
            )}
            <div className="mt-1 flex justify-between border-t border-line pt-4 text-lg">
              <dt className="font-medium">Tổng cộng</dt>
              <dd className="font-medium">{formatPrice(total)}</dd>
            </div>
          </dl>

          {/* Chọn một trong hai rồi mới đặt: phí giao hàng của mỗi hình thức do chủ
              shop khai riêng, nên tổng tiền ở trên phải đổi theo lựa chọn trước khi
              khách bấm. Chỉ mở một hình thức thì khỏi bắt chọn. */}
          {cachChon.length > 1 && (
            <fieldset className="mt-6 border-t border-line pt-5">
              <legend className="eyebrow text-ink/60">Hình thức thanh toán</legend>
              <div className="mt-4 flex flex-col gap-2.5">
                {cachChon.map((key) => {
                  const phi = shippingFeeFor(sales, key, count);
                  return (
                    <label
                      key={key}
                      className={`flex cursor-pointer gap-3 rounded-card border p-3.5 transition ${
                        method === key ? "border-ink bg-cream" : "border-line hover:border-ink/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={key}
                        checked={method === key}
                        onChange={() => setMethod(key)}
                        className="mt-1 accent-ink"
                      />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className="text-[15px] font-medium">{TEN_PHUONG_THUC[key]}</span>
                          <span className="text-[13px] text-muted">
                            Phí giao hàng: {phi === 0 ? "miễn phí" : formatPrice(phi)}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-[13px] text-muted">
                          {MO_TA_PHUONG_THUC[key]}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? NHAN_NUT_DANG_GUI[method] : NHAN_NUT_DAT[method]}
            {!submitting && <ArrowRight />}
          </button>

          <p aria-live="polite" className="mt-3 min-h-5 text-[13px] leading-relaxed text-gold-deep">
            {formError}
          </p>

          <p className="text-[13px] leading-relaxed text-muted">
            {method === "cod"
              ? "Hoá đơn được gửi thẳng tới shop, không có mã QR. Bạn trả tiền mặt cho người giao hàng."
              : "Bước tiếp theo là mã QR VietQR để chuyển khoản qua ứng dụng ngân hàng. Đơn hàng chỉ được xác nhận sau khi chúng tôi nhận được tiền."}
          </p>

          <Link
            href="/cart"
            className="mt-4 block text-center text-[13px] text-muted underline underline-offset-4 transition-colors hover:text-ink"
          >
            Quay lại giỏ hàng
          </Link>
        </div>
      </aside>
    </form>
  );
}
