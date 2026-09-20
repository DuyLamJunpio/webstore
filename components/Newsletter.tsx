"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CONTACT } from "@/lib/contact";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  Facebook,
  Mail,
  Messenger,
  Phone,
  Return,
  Shield,
  Ship,
  Sparkles,
} from "./icons";

const SHOPEE_URL = "https://s.shopee.vn/50YFikittI";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;
    setDone(true);
  };

  return (
    <section id="newsletter" className="shell section">
      <div className="border border-line bg-white shadow-xs">
        <div className="p-6 sm:p-10 md:p-12 lg:p-14">
          {/* ── Header ────────────────────────────────────────────── */}
          <div className="max-w-2xl">
            <span className="inline-block bg-[#e60012] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-2xs">
              ĐẶC QUYỀN THÀNH VIÊN LIFEWEAR
            </span>
            <h2 className="mt-3 font-sans text-[clamp(1.85rem,3.8vw,3rem)] font-extrabold uppercase leading-[1.1] tracking-[-0.015em] text-ink">
              Nhận ngay coupon 100.000đ
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#555555]">
              Đăng ký nhận bản tin để nhận ngay mã ưu đãi <strong>100.000đ</strong> cho đơn hàng đầu tiên, đồng thời
              nhận thông tin sớm nhất về các chương trình Khuyến Mãi Có Hạn (Limited Offer) và bộ sưu tập mới.
            </p>
          </div>

          {/* ── Main Content Grid ─────────────────────────────────── */}
          <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:gap-10 items-stretch">
            {/* Cột trái: Kênh liên hệ & hỗ trợ trực tiếp */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-6">
              <div className="grid gap-3.5 sm:grid-cols-2">
                {/* 1. Hotline */}
                <a
                  href={CONTACT.phoneHref}
                  className="group flex flex-col justify-between border border-line bg-[#f7f7f7] p-5 transition-colors hover:border-black hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center bg-white border border-line text-[#e60012]">
                      <Phone className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted group-hover:text-ink">
                      Gọi ngay ↗
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase text-[#767676]">Hotline Đặt hàng</p>
                    <p className="mt-1 text-base sm:text-lg font-extrabold text-ink tracking-wide">
                      {CONTACT.phoneDisplay}
                    </p>
                    <p className="mt-1 text-[11px] text-muted flex items-center gap-1">
                      <Clock className="h-3 w-3 text-[#e60012]" /> 8:30 – 22:00 (Hằng ngày)
                    </p>
                  </div>
                </a>

                {/* 2. Zalo Tư vấn */}
                <a
                  href={CONTACT.zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col justify-between border border-line bg-[#f7f7f7] p-5 transition-colors hover:border-black hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center bg-white border border-line text-[#0084FF]">
                      <Messenger className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted group-hover:text-ink">
                      Nhắn Zalo ↗
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase text-[#767676]">Zalo Official</p>
                    <p className="mt-1 text-base sm:text-lg font-extrabold text-ink">
                      {CONTACT.phoneDisplay}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      Tư vấn dáng người & ảnh thực tế
                    </p>
                  </div>
                </a>

                {/* 3. Facebook Fanpage */}
                <a
                  href={CONTACT.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col justify-between border border-line bg-[#f7f7f7] p-5 transition-colors hover:border-black hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center bg-white border border-line text-[#1877F2]">
                      <Facebook className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted group-hover:text-ink">
                      Fanpage ↗
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase text-[#767676]">Fanpage Facebook</p>
                    <p className="mt-1 text-base sm:text-lg font-extrabold text-ink truncate">
                      The Basic Concept
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      Lookbook & sự kiện mua sắm
                    </p>
                  </div>
                </a>

                {/* 4. Dịch vụ in áo UTme! */}
                <Link
                  href="/in-ao"
                  className="group flex flex-col justify-between border border-line bg-[#f7f7f7] p-5 transition-colors hover:border-black hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center bg-white border border-line text-[#e60012]">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted group-hover:text-ink">
                      Khám phá ↗
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase text-[#767676]">TBC UTme! Studio</p>
                    <p className="mt-1 text-base sm:text-lg font-extrabold text-ink">
                      Tự thiết kế áo in
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      In áo cá nhân / hội nhóm từ 1 chiếc
                    </p>
                  </div>
                </Link>
              </div>

              {/* Dải cam kết dịch vụ */}
              <div className="grid grid-cols-3 gap-2 border border-line bg-[#f7f7f7] p-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <Shield className="h-4 w-4 text-[#e60012]" />
                  <span className="text-xs font-bold uppercase text-ink">100% Tiêu chuẩn</span>
                  <span className="text-[10px] text-muted">Cotton mềm mịn</span>
                </div>
                <div className="flex flex-col items-center gap-1 border-x border-line px-1">
                  <Return className="h-4 w-4 text-[#e60012]" />
                  <span className="text-xs font-bold uppercase text-ink">Đổi hàng 7 ngày</span>
                  <span className="text-[10px] text-muted">Hỗ trợ nhanh chóng</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Ship className="h-4 w-4 text-[#e60012]" />
                  <span className="text-xs font-bold uppercase text-ink">Giao tận nơi</span>
                  <span className="text-[10px] text-muted">Đồng kiểm khi nhận</span>
                </div>
              </div>
            </div>

            {/* Cột phải: Form Đăng ký nhận ưu đãi UNIQLO Member */}
            <div className="lg:col-span-5 flex flex-col justify-between border border-line bg-[#f7f7f7] p-6 sm:p-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#e60012]">
                  ĐĂNG KÝ EMAIL
                </span>
                <h3 className="mt-1 font-sans text-xl sm:text-2xl font-extrabold uppercase text-ink">
                  Đăng ký nhận bản tin
                </h3>
                <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-[#555555]">
                  Nhận ngay mã giảm giá <strong>100.000đ</strong> áp dụng cho đơn hàng đầu tiên của bạn trên hệ thống.
                </p>
              </div>

              <div className="mt-6">
                {done ? (
                  <div className="border border-[#e60012] bg-white p-5 text-ink fade-in">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-6 w-6 place-items-center bg-[#e60012] text-white font-bold text-xs shrink-0">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </span>
                      <p className="text-sm font-bold uppercase tracking-wider text-ink">
                        Đăng ký thành công!
                      </p>
                    </div>
                    <div className="mt-3.5 bg-[#f4f4f4] p-3 border border-line text-center">
                      <p className="text-[11px] text-muted uppercase font-bold">Mã coupon chào mừng của bạn:</p>
                      <p className="text-base font-mono font-black text-[#e60012] tracking-widest mt-0.5">
                        LIFEWEAR100K
                      </p>
                    </div>
                    <p className="mt-2.5 text-[11px] text-muted text-center">
                      Áp dụng cho mọi đơn hàng từ 499.000đ khi thanh toán trên website.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={onSubmit} className="flex flex-col gap-3">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập địa chỉ email của bạn..."
                        className="h-11 w-full border border-black/30 bg-white pl-10 pr-4 text-xs sm:text-sm text-ink placeholder:text-muted/65 outline-none transition-colors focus:border-black"
                      />
                    </div>

                    <button
                      type="submit"
                      className="h-11 w-full bg-[#e60012] px-6 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#cc0010] active:scale-98 flex items-center justify-center gap-2"
                    >
                      <span>ĐĂNG KÝ NHẬN COUPON</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                )}

                <p className="mt-4 text-[11px] text-muted text-center flex items-center justify-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-[#e60012]" /> Chúng tôi tôn trọng quyền riêng tư và cam kết không spam.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
