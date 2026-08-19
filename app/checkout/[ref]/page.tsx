import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ClearCartOnPaid from "@/components/checkout/ClearCartOnPaid";
import CopyField from "@/components/checkout/CopyField";
import PaymentWatcher from "@/components/checkout/PaymentWatcher";
import QrCode from "@/components/checkout/QrCode";
import { ArrowRight, ArrowUpRight, Shield } from "@/components/icons";
import { bankName } from "@/lib/banks";
import { formatAddress } from "@/lib/checkout";
import { isOpen, syncOrderStatus } from "@/lib/order-status";
import { getOrder, type Order } from "@/lib/orders";
import { formatPrice } from "@/lib/data";

export const metadata: Metadata = {
  title: "Thanh toán đơn hàng",
  // an order page holds a name, a phone number and an address
  robots: { index: false, follow: false },
};

/** items, totals and where it is going — the same panel on every branch */
function OrderSummary({ order }: { order: Order }) {
  const { cart, customer } = order;

  return (
    <aside className="lg:sticky lg:top-[92px] lg:self-start">
      <div className="rounded-block border border-line bg-surface p-6">
        <h2 className="eyebrow text-ink/60">Đơn hàng ({cart.count} sản phẩm)</h2>

        <ul className="mt-5 flex flex-col gap-4">
          {cart.lines.map((line) => (
            <li key={line.id} className="flex gap-3">
              <div className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-card bg-cream ring-1 ring-line">
                <Image src={line.image} alt="" fill sizes="56px" className="object-cover" />
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] font-medium text-cream">
                  {line.qty}
                </span>
              </div>
              <div className="flex flex-1 items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-medium leading-snug">
                    <Link href={`/products/${line.slug}`}>{line.name}</Link>
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {line.color} · {line.size}
                  </p>
                </div>
                <p className="shrink-0 text-[14px] font-medium">{formatPrice(line.total)}</p>
              </div>
            </li>
          ))}
        </ul>

        <dl className="mt-6 flex flex-col gap-3 border-t border-line pt-5 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-muted">Tạm tính</dt>
            <dd className="font-medium">{formatPrice(cart.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Phí giao hàng</dt>
            <dd className="font-medium">
              {cart.shipping === 0 ? "Miễn phí" : formatPrice(cart.shipping)}
            </dd>
          </div>
          <div className="mt-1 flex justify-between border-t border-line pt-4 text-lg">
            <dt className="font-medium">Tổng cộng</dt>
            <dd className="font-medium">{formatPrice(cart.total)}</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-line pt-5">
          <h3 className="eyebrow text-ink/60">Giao đến</h3>
          <p className="mt-3 text-[14px] font-medium">{customer.fullName}</p>
          <p className="text-[13px] leading-relaxed text-muted">
            {customer.phone}
            {customer.email && ` · ${customer.email}`}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{formatAddress(customer)}</p>
          {customer.note && (
            <p className="mt-2 text-[13px] leading-relaxed text-muted">Ghi chú: {customer.note}</p>
          )}
        </div>
      </div>
    </aside>
  );
}

/**
 * Đơn trả khi nhận hàng: không có mã QR, không có đồng hồ đếm ngược, không có gì
 * để chờ. Khách chỉ cần biết đơn đã vào sổ và sẽ trả bao nhiêu cho người giao.
 */
function CodConfirmation({ order }: { order: Order }) {
  return (
    <div className="shell section">
      <nav aria-label="Đường dẫn" className="text-[13px] text-muted">
        <Link href="/" className="transition-colors hover:text-ink">
          Trang chủ
        </Link>
        <span className="px-2">/</span>
        <span className="text-ink">Đơn {order.ref}</span>
      </nav>

      <h1 className="mt-4 font-serif text-[clamp(2.25rem,4vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.015em]">
        Đã Nhận Đơn Hàng
      </h1>
      <p className="mt-3 text-[15px] text-muted">
        Mã đơn hàng <span className="font-medium tracking-wide text-ink">{order.ref}</span>
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          {/* Đơn đã vào sổ bên kho rồi, giữ lại giỏ chỉ khiến khách đặt trùng. */}
          <ClearCartOnPaid />
          <div className="rounded-block border border-line bg-surface p-8">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-ink text-cream">
              <Shield />
            </span>
            <h2 className="mt-5 font-serif text-3xl font-medium">Cảm ơn bạn!</h2>
            <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-muted">
              Bạn trả <span className="font-medium text-ink">{formatPrice(order.cart.total)}</span>{" "}
              bằng tiền mặt cho người giao hàng khi nhận. Shop sẽ gọi số{" "}
              {order.customer.phone} để xác nhận trước khi gửi đi.
            </p>
            <Link
              href="/shop"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-7 text-sm font-medium text-cream transition-opacity hover:opacity-90"
            >
              Tiếp tục mua sắm
              <ArrowRight />
            </Link>
          </div>
        </section>

        <OrderSummary order={order} />
      </div>
    </div>
  );
}

export default async function OrderPage(props: PageProps<"/checkout/[ref]">) {
  const { ref } = await props.params;
  const { huy } = await props.searchParams;

  const stored = await getOrder(ref);
  if (!stored) notFound();

  const order = await syncOrderStatus(stored);
  if (order.paymentMethod === "cod") return <CodConfirmation order={order} />;

  const { payment } = order;
  // UNDERPAID still shows the QR: the link is open and the shortfall is payable
  const waiting = isOpen(order.status);
  const shortfall = order.status === "UNDERPAID" ? payment.amount - (order.amountPaid ?? 0) : 0;

  return (
    <div className="shell section">
      <nav aria-label="Đường dẫn" className="text-[13px] text-muted">
        <Link href="/" className="transition-colors hover:text-ink">
          Trang chủ
        </Link>
        <span className="px-2">/</span>
        <Link href="/cart" className="transition-colors hover:text-ink">
          Giỏ hàng
        </Link>
        <span className="px-2">/</span>
        <span className="text-ink">Đơn {order.ref}</span>
      </nav>

      <h1 className="mt-4 font-serif text-[clamp(2.25rem,4vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.015em]">
        {order.status === "PAID" ? "Đã Nhận Thanh Toán" : waiting ? "Chuyển Khoản" : "Đơn Hàng Đã Đóng"}
      </h1>
      <p className="mt-3 text-[15px] text-muted">
        Mã đơn hàng <span className="font-medium tracking-wide text-ink">{order.ref}</span>
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          {order.status === "PAID" && (
            <>
              <ClearCartOnPaid />
              <div className="rounded-block border border-line bg-surface p-8">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-ink text-cream">
                  <Shield />
                </span>
                <h2 className="mt-5 font-serif text-3xl font-medium">Cảm ơn bạn!</h2>
                <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-muted">
                  Chúng tôi đã nhận được {formatPrice(payment.amount)}. Đơn hàng đang được chuẩn bị và
                  sẽ được giao trong 2–4 ngày làm việc. Bạn sẽ nhận được tin nhắn xác nhận qua số{" "}
                  {order.customer.phone}.
                </p>
                {order.transactionRef && (
                  <p className="mt-4 text-[13px] text-muted">
                    Mã giao dịch ngân hàng:{" "}
                    <span className="font-medium text-ink">{order.transactionRef}</span>
                  </p>
                )}
                <Link
                  href="/shop"
                  className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-7 text-sm font-medium text-cream transition-opacity hover:opacity-90"
                >
                  Tiếp tục mua sắm
                  <ArrowRight />
                </Link>
              </div>
            </>
          )}

          {!waiting && order.status !== "PAID" && (
            <div className="rounded-block border border-line bg-surface p-8">
              <h2 className="font-serif text-3xl font-medium">
                {order.status === "EXPIRED"
                  ? "Mã QR đã hết hạn"
                  : order.status === "FAILED"
                    ? "Giao dịch không thành công"
                    : "Đơn hàng đã được huỷ"}
              </h2>
              <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-muted">
                {order.status === "EXPIRED"
                  ? "Mã chuyển khoản chỉ có hiệu lực trong một khoảng thời gian ngắn để số tiền luôn khớp với đơn hàng."
                  : order.status === "FAILED"
                    ? "Ngân hàng báo giao dịch không thực hiện được. Nếu tài khoản của bạn đã bị trừ tiền, số tiền sẽ được hoàn lại tự động."
                    : "Đơn hàng này đã bị huỷ nên mã chuyển khoản không còn hiệu lực."}{" "}
                Giỏ hàng của bạn vẫn còn nguyên — bạn có thể tạo lại đơn mới bất cứ lúc nào.
              </p>
              <p className="mt-3 text-[13px] text-muted">
                Nếu bạn đã chuyển khoản cho đơn này, vui lòng liên hệ với chúng tôi kèm mã đơn{" "}
                <span className="font-medium text-ink">{order.ref}</span> — chúng tôi sẽ kiểm tra và
                hoàn tiền nếu cần.
              </p>
              <Link
                href="/checkout"
                className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-7 text-sm font-medium text-cream transition-opacity hover:opacity-90"
              >
                Tạo đơn hàng mới
                <ArrowRight />
              </Link>
            </div>
          )}

          {waiting && (
            <>
              <PaymentWatcher orderRef={order.ref} status={order.status} expiresAt={order.expiresAt} />

              {shortfall > 0 && (
                <p className="mt-4 rounded-card border border-gold-soft bg-surface px-4 py-3 text-[13px] leading-relaxed">
                  <span className="font-medium">Đã nhận {formatPrice(order.amountPaid ?? 0)}</span> — còn
                  thiếu <span className="font-medium">{formatPrice(shortfall)}</span>. Bạn chuyển thêm
                  phần còn thiếu với đúng nội dung bên dưới là đơn hàng sẽ được xác nhận.
                </p>
              )}

              {huy && (
                <p className="mt-4 rounded-card border border-line bg-surface px-4 py-3 text-[13px] leading-relaxed text-muted">
                  Bạn đã rời khỏi trang thanh toán của PayOS. Mã QR bên dưới vẫn còn hiệu lực nếu bạn
                  muốn tiếp tục.
                </p>
              )}

              {payment.provider === "fallback" && (
                <p className="mt-4 rounded-card border border-gold-soft bg-surface px-4 py-3 text-[13px] leading-relaxed text-muted">
                  <span className="font-medium text-ink">Chế độ xem thử.</span> Cửa hàng chưa cấu hình
                  PayOS, nên mã QR này trỏ thẳng tới tài khoản ngân hàng của cửa hàng và không có hệ
                  thống nào tự động đối soát. Đơn hàng sẽ được xác nhận thủ công.
                </p>
              )}

              <div className="mt-6 grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
                <div className="rounded-block border border-line bg-surface p-5">
                  <div className="w-[min(72vw,240px)] overflow-hidden rounded-card bg-white p-2">
                    <QrCode
                      value={payment.qrCode}
                      label={`Mã QR chuyển khoản ${formatPrice(payment.amount)} cho đơn ${order.ref}`}
                      className="block h-auto w-full"
                    />
                  </div>
                  <p className="mt-4 text-center font-serif text-2xl font-medium">
                    {formatPrice(payment.amount)}
                  </p>
                  <p className="mt-1 text-center text-[12px] text-muted">
                    Mở app ngân hàng · Quét mã · Xác nhận
                  </p>
                </div>

                <div className="rounded-block border border-line bg-surface px-5 py-2">
                  <CopyField label="Ngân hàng" value={payment.bankName || bankName(payment.bin)} />
                  <CopyField label="Số tài khoản" value={payment.accountNumber} />
                  <CopyField label="Chủ tài khoản" value={payment.accountName} />
                  <CopyField
                    label="Số tiền"
                    value={String(payment.amount)}
                    display={formatPrice(payment.amount)}
                    emphasis
                  />
                  <CopyField
                    label="Nội dung chuyển khoản"
                    value={payment.description}
                    hint="Giữ nguyên nội dung này để đơn hàng được đối soát tự động."
                    emphasis
                  />
                </div>
              </div>

              <p className="mt-5 text-[13px] leading-relaxed text-muted">
                Quét mã bằng ứng dụng ngân hàng thì số tiền và nội dung đã được điền sẵn — đó là cách
                an toàn nhất. Nếu nhập tay, vui lòng sao chép chính xác từng dòng ở trên.
              </p>

              {payment.checkoutUrl && (
                <a
                  href={payment.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium underline underline-offset-4 transition-colors hover:text-gold-deep"
                >
                  Mở trang thanh toán PayOS
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}
            </>
          )}
        </section>

        <OrderSummary order={order} />
      </div>
    </div>
  );
}
