import Image from "next/image";
import { CONTACT } from "@/lib/contact";
import { ArrowUpRight, Check, Facebook, Messenger, Sparkles } from "./icons";

const FB_BLUE = "#1877F2";
const MESSENGER_URL = "https://m.me/61591378517545";

const perks = [
  {
    title: "Tư vấn chọn size 1:1",
    desc: "Nhắn tin qua Messenger để nhận tư vấn dáng người, xem video/ảnh thực tế của từng sản phẩm.",
  },
  {
    title: "Cập nhật Lookbook & Outfit mới",
    desc: "Theo dõi các bài viết phối đồ, gợi ý phong cách tối giản hằng ngày và thông báo drop hàng mới.",
  },
  {
    title: "Ưu đãi & Minigame độc quyền",
    desc: "Nhận thông báo sớm nhất về các chương trình tri ân khách hàng và voucher giảm giá thành viên.",
  },
];

export default function FacebookSection() {
  return (
    <section id="facebook" className="shell section">
      <div className="overflow-hidden rounded-block bg-surface ring-1 ring-line shadow-xs">
        <div className="grid items-center gap-10 px-6 py-12 sm:px-10 md:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 xl:px-16">
          {/* ── Cột trái: Giới thiệu & Lợi ích ─────────────────── */}
          <div>
            <span
              className="eyebrow inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] text-white"
              style={{ backgroundColor: FB_BLUE }}
            >
              <Facebook className="h-3.5 w-3.5" />
              Fanpage chính thức
            </span>

            <h2 className="mt-5 font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.015em] text-ink">
              Kết nối cùng The Basic Concept trên Facebook
            </h2>

            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
              Theo dõi trang Facebook chính thức của The Basic Concept để cập nhật nhanh nhất các bộ sưu tập
              mới, đón xem lookbook outfit thường ngày và nhận hỗ trợ tư vấn trực tiếp từ đội ngũ của chúng tôi.
            </p>

            {/* Danh sách lợi ích */}
            <div className="mt-8 flex flex-col gap-4">
              {perks.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3.5 rounded-2xl bg-cream/60 p-3.5 ring-1 ring-line/60 transition-colors hover:bg-cream"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-gold shadow-2xs">
                    <Sparkles className="h-4 w-4 text-gold-deep" />
                  </span>
                  <div className="text-xs sm:text-[13px] leading-relaxed">
                    <h3 className="font-semibold text-ink">{item.title}</h3>
                    <p className="mt-0.5 text-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Nút hành động */}
            <div className="mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
              <a
                href={CONTACT.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: FB_BLUE }}
              >
                <Facebook className="h-4 w-4" />
                Ghé thăm Fanpage
                <ArrowUpRight className="h-4 w-4" />
              </a>

              <a
                href={MESSENGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-line-strong bg-cream px-6 text-sm font-semibold text-ink shadow-2xs transition-all duration-300 hover:border-ink hover:bg-white active:scale-[0.98]"
              >
                <Messenger className="h-4 w-4 text-[#00B2FF]" />
                Nhắn tin Messenger
              </a>
            </div>
          </div>

          {/* ── Cột phải: Khung mô phỏng Fanpage Card sang trọng ── */}
          <div className="relative mx-auto w-full max-w-md lg:mx-0">
            <div className="overflow-hidden rounded-3xl bg-cream shadow-xl ring-1 ring-line">
              {/* Cover Photo */}
              <div className="relative h-32 w-full bg-gradient-to-r from-ink via-ink-soft to-[#3a302a] p-4 text-cream flex items-end justify-between">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#FAF7F2_1px,transparent_1px)] [background-size:12px_12px]" />
                <div className="relative z-10">
                  <span className="eyebrow text-[10px] text-gold font-bold">The Basic Concept</span>
                  <p className="text-[11px] text-cream/70">Simple. Everyday. For Everyone.</p>
                </div>
                <div className="relative z-10 flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-xs px-2.5 py-1 text-[10px] text-cream font-medium">
                  <Facebook className="h-3 w-3 text-white" />
                  <span>Facebook Page</span>
                </div>
              </div>

              {/* Fanpage Header Profile */}
              <div className="relative px-5 pb-5 pt-3">
                {/* Avatar */}
                <div className="absolute -top-10 left-5 h-20 w-20 overflow-hidden rounded-2xl border-4 border-cream bg-white shadow-md">
                  <Image
                    src="/apple-icon.png"
                    alt="The Basic Concept Fanpage Avatar"
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="pt-11">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-serif text-lg font-bold text-ink">The Basic Concept</h3>
                    <span
                      title="Trang chính thức"
                      className="grid h-4 w-4 place-items-center rounded-full bg-blue-500 text-white text-[9px]"
                    >
                      <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                    </span>
                  </div>

                  <p className="text-xs text-muted mt-0.5">Thương hiệu thời trang · Trang phục thường ngày</p>
                  
                  {/* Quick stats */}
                  <div className="mt-3.5 grid grid-cols-3 gap-2 border-y border-line/70 py-3 text-center">
                    <div>
                      <span className="block text-sm font-bold text-ink">100%</span>
                      <span className="text-[10px] text-muted">Phản hồi nhanh</span>
                    </div>
                    <div className="border-x border-line/70">
                      <span className="block text-sm font-bold text-ink">24/7</span>
                      <span className="text-[10px] text-muted">Hỗ trợ online</span>
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-ink">Lookbook</span>
                      <span className="text-[10px] text-muted">Cập nhật tuần</span>
                    </div>
                  </div>

                  {/* Fanpage Link Box */}
                  <div className="mt-4 rounded-xl bg-surface p-3 ring-1 ring-line/80 flex items-center justify-between gap-2">
                    <div className="truncate text-xs">
                      <span className="text-muted block text-[10px]">Đường dẫn trang Facebook:</span>
                      <span className="font-medium text-ink truncate block">fb.com/TheBasicConcept</span>
                    </div>
                    <a
                      href={CONTACT.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-cream transition-transform active:scale-95"
                    >
                      Mở trang
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
