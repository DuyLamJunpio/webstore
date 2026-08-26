import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import { ArrowUpRight, Check, Phone, Sparkles } from "@/components/icons";
import BlankPicker from "@/components/print/BlankPicker";
import { CONTACT } from "@/lib/contact";
import { formatPrice } from "@/lib/data";
import { bookableBlanks, getPrintCatalogue } from "@/lib/print-catalogue";

export const metadata: Metadata = {
  title: "In áo theo yêu cầu",
  description:
    "Chọn phôi, chọn màu, đặt hình lên áo rồi xem giá ngay. In áo lớp, áo nhóm, áo đồng phục theo thiết kế của bạn.",
};

export default async function PrintLandingPage() {
  const catalogue = await getPrintCatalogue();

  if (!catalogue) {
    return (
      <main className="shell pt-28 pb-20 text-center">
        <h1 className="font-serif text-3xl text-ink">In áo theo yêu cầu</h1>
        <p className="measure mt-4 text-muted">
          Dịch vụ đang tạm ngưng nhận đơn trực tuyến. Bạn nhắn tin cho shop để được báo giá trực tiếp nhé.
        </p>
      </main>
    );
  }

  const blanks = bookableBlanks(catalogue);
  const cheapest = blanks.reduce((min, b) => Math.min(min, b.base_price), Infinity);
  const fastest = blanks.reduce((min, b) => Math.min(min, b.lead_days), Infinity);

  return (
    <main className="pb-20">
      {/* ── Mở đầu ── */}
      <section className="shell pt-24 pb-8 sm:pt-28">
        <div className="measure text-center">
          <p className="eyebrow text-gold-deep">Dịch vụ của shop</p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl leading-[1.1] text-ink text-balance">
            In áo theo thiết kế của bạn
          </h1>
          <p className="mt-4 text-sm sm:text-base text-muted">
            Chọn phôi, chọn màu và size, rồi kéo hình của bạn lên áo. Giá hiện ngay theo từng thay đổi —
            không phải nhắn tin chờ báo giá.
          </p>
        </div>

        {/* ── Thống kê phôi & dịch vụ ── */}
        {blanks.length > 0 && (
          <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { k: "Phôi đang có", v: String(blanks.length) },
              { k: "Giá phôi từ", v: formatPrice(cheapest) },
              { k: "Kỹ thuật in", v: String(catalogue.techniques.length) },
              { k: "Giao nhanh nhất", v: `${fastest} ngày` },
            ].map((stat) => (
              <div key={stat.k} className="rounded-card border border-line bg-surface px-4 py-3.5 text-center shadow-2xs">
                <dt className="eyebrow text-muted text-[10px] sm:text-[11px]">{stat.k}</dt>
                <dd className="mt-1 font-semibold text-ink tabular-nums text-sm sm:text-base">{stat.v}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* ── Banner: Đặt in đồng phục & Số lượng lớn (Đưa lên đầu trang) ── */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-cream via-surface to-cream-dark/50 p-6 sm:p-8 md:p-10 shadow-sm ring-1 ring-line/60">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10 items-center">
            <div>
              <span className="eyebrow inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold-deep">
                <Sparkles className="h-3.5 w-3.5" />
                Đồng phục & Đơn hàng lớn
              </span>

              <h2 className="mt-3 font-serif text-2xl sm:text-3xl font-medium text-ink leading-snug">
                Cần in áo số lượng lớn? Nhận báo giá trực tiếp & ưu đãi tốt nhất
              </h2>

              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-muted">
                Áo đồng phục công ty, áo sự kiện, áo lớp hoặc đơn hàng lớn — chúng tôi hỗ trợ tư vấn chọn
                chất liệu phôi riêng, tùy biến bảng size và chiết khấu giá hấp dẫn theo số lượng.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink/80 font-medium">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-gold-deep" /> Chiết khấu giá theo số lượng
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-gold-deep" /> Hỗ trợ may mẫu & thiết kế
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-gold-deep" /> Giao hàng đúng hẹn
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-center lg:items-end">
              <a
                href={CONTACT.zaloUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-7 text-sm font-semibold text-cream shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Nhắn Zalo nhận báo giá</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>

              <a
                href={CONTACT.phoneHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-6 text-sm font-semibold text-ink shadow-xs transition-colors hover:border-ink active:scale-[0.98]"
              >
                <Phone className="h-4 w-4 text-gold" />
                <span>Gọi {CONTACT.phoneDisplay}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Chọn phôi ── */}
      <section className="shell mt-6 sm:mt-10">
        <SectionHeading title="Chọn phôi áo" subtitle="Lọc theo danh mục để tìm nhanh. Mỗi phôi có kỹ thuật in và chỗ in riêng." />

        <BlankPicker blanks={blanks} />
      </section>

      {/* ── Cách làm việc ── */}
      <section className="shell mt-16 sm:mt-20">
        <SectionHeading title="Từ ý tưởng tới chiếc áo" subtitle="Bốn bước, không bước nào phải chờ shop nhắn lại." />
        <ol className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { t: "Thiết kế", d: "Kéo hình của bạn lên áo, hoặc chọn sticker có sẵn. Giá đổi theo từng thay đổi." },
            {
              t: "Đặt và thanh toán",
              d: "Chốt số lượng, điền thông tin nhận hàng rồi chuyển khoản. Áo in là hàng làm riêng nên shop không nhận trả khi nhận hàng. Cần in số lượng lớn, shop báo giá trực tiếp.",
            },
            { t: "Shop duyệt thiết kế", d: "Nhân viên kiểm file có đủ nét và in được không. Không đạt thì shop báo lại và hoàn tiền." },
            { t: "In và giao", d: "Duyệt xong mới vào xưởng. Thời gian tuỳ kỹ thuật, hiện sẵn ở bước chọn." },
          ].map((step, i) => (
            <li key={step.t} className="rounded-card border border-line bg-surface p-5 shadow-2xs">
              <span className="eyebrow text-gold-deep tabular-nums">Bước {i + 1}</span>
              <h3 className="mt-2 font-semibold text-ink">{step.t}</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">{step.d}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
