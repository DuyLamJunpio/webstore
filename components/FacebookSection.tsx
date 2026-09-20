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
      <div className="border border-line bg-white shadow-xs">
        <div className="grid items-center gap-10 p-6 sm:p-10 md:p-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          {/* ── Cột trái: Giới thiệu & Lợi ích ─────────────────── */}
          <div>
            <span
              className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white"
              style={{ backgroundColor: FB_BLUE }}
            >
              <Facebook className="h-3.5 w-3.5" />
              FANPAGE CHÍNH THỨC
            </span>

            <h2 className="mt-4 font-sans text-[clamp(1.75rem,3.4vw,2.75rem)] font-extrabold uppercase leading-[1.1] tracking-[-0.015em] text-ink">
              KẾT NỐI CÙNG THE BASIC CONCEPT TRÊN FACEBOOK
            </h2>

            <p className="mt-4 max-w-lg text-sm sm:text-base leading-relaxed text-[#555555]">
              Theo dõi fanpage chính thức để cập nhật nhanh nhất các bộ sưu tập mới, đón xem lookbook phối đồ LifeWear hằng ngày và nhận hỗ trợ tư vấn trực tiếp từ đội ngũ The Basic Concept.
            </p>

            {/* Danh sách lợi ích */}
            <div className="mt-8 flex flex-col gap-3.5">
              {perks.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3.5 border border-line bg-[#f7f7f7] p-3.5 transition-colors hover:border-black hover:bg-white"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center bg-[#e60012] text-white">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </span>
                  <div className="text-xs sm:text-[13px] leading-relaxed">
                    <h3 className="font-bold uppercase tracking-wide text-ink">{item.title}</h3>
                    <p className="mt-0.5 text-[#555555]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Nút hành động */}
            <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <a
                href={CONTACT.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 px-7 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:opacity-95"
                style={{ backgroundColor: FB_BLUE }}
              >
                <Facebook className="h-4 w-4" />
                <span>Ghé thăm Fanpage</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>

              <a
                href={MESSENGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 border border-black bg-white px-6 text-xs font-bold uppercase tracking-wider text-black shadow-2xs transition-colors hover:bg-black hover:text-white"
              >
                <Messenger className="h-4 w-4 text-[#00B2FF]" />
                <span>Nhắn tin Messenger</span>
              </a>
            </div>
          </div>

          {/* ── Cột phải: Khung mô phỏng Fanpage Card sắc sảo ── */}
          <div className="relative mx-auto w-full max-w-md lg:mx-0">
            <div className="border border-line bg-[#f7f7f7] shadow-xs">
              {/* Cover Photo */}
              <div className="relative h-28 w-full bg-black p-4 text-white flex items-end justify-between">
                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e60012]">
                    THE BASIC CONCEPT
                  </span>
                  <p className="text-[11px] text-white/70">LifeWear: Simple. Everyday. For Everyone.</p>
                </div>
                <div className="relative z-10 flex items-center gap-1 bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase text-white">
                  <Facebook className="h-3 w-3 text-white" />
                  <span>Facebook Page</span>
                </div>
              </div>

              {/* Fanpage Header Profile */}
              <div className="relative px-5 pb-5 pt-3">
                {/* Avatar */}
                <div className="absolute -top-8 left-5 h-16 w-16 overflow-hidden border-2 border-white bg-white shadow-sm">
                  <Image
                    src="/apple-icon.png"
                    alt="The Basic Concept Fanpage Avatar"
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="pt-9">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-sans text-base font-extrabold uppercase tracking-tight text-ink">
                      The Basic Concept
                    </h3>
                    <span
                      title="Trang chính thức"
                      className="grid h-4 w-4 place-items-center bg-blue-500 text-white text-[9px]"
                    >
                      <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                    </span>
                  </div>

                  <p className="text-xs text-[#777777] mt-0.5">Thời trang LifeWear · Trang phục thường ngày</p>
                  
                  {/* Quick stats */}
                  <div className="mt-3.5 grid grid-cols-3 gap-2 border-y border-[#e5e5e5] py-3 text-center">
                    <div>
                      <span className="block text-sm font-extrabold text-ink">100%</span>
                      <span className="text-[10px] font-medium text-[#777777]">Phản hồi nhanh</span>
                    </div>
                    <div className="border-x border-[#e5e5e5]">
                      <span className="block text-sm font-extrabold text-ink">24/7</span>
                      <span className="text-[10px] font-medium text-[#777777]">Hỗ trợ online</span>
                    </div>
                    <div>
                      <span className="block text-sm font-extrabold text-ink">Lookbook</span>
                      <span className="text-[10px] font-medium text-[#777777]">Cập nhật tuần</span>
                    </div>
                  </div>

                  {/* Fanpage Link Box */}
                  <div className="mt-4 border border-[#e5e5e5] bg-white p-3 flex items-center justify-between gap-2">
                    <div className="truncate text-xs">
                      <span className="text-[#777777] block text-[10px] uppercase font-semibold">Đường dẫn:</span>
                      <span className="font-bold text-ink truncate block">fb.com/TheBasicConcept</span>
                    </div>
                    <a
                      href={CONTACT.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 bg-black px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#e60012]"
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
