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
      <div className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-[#161210] text-cream border border-[#2b2420] shadow-2xl">
        {/* Background decorative textures */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-gold/5 blur-2xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(#FAF7F2_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative p-6 sm:p-10 md:p-14 lg:p-16">
          {/* ── Header ────────────────────────────────────────────── */}
          <div className="max-w-2xl">
            <span className="eyebrow inline-flex items-center gap-2 text-gold font-bold text-xs tracking-[0.2em]">
              <Sparkles className="h-4 w-4 text-gold" />
              LIÊN HỆ & CHĂM SÓC KHÁCH HÀNG
            </span>
            <h2 className="mt-3 font-serif text-[clamp(2.1rem,4vw,3.5rem)] font-medium leading-[1.08] tracking-[-0.015em] text-cream">
              Đồng hành cùng phong cách của bạn
            </h2>
            <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-cream/70">
              Đội ngũ The Basic Concept luôn sẵn sàng hỗ trợ tư vấn kích cỡ trang phục, dịch vụ in áo thiết kế riêng
              hoặc giải đáp bất kỳ thắc mắc nào về đơn hàng của bạn.
            </p>
          </div>

          {/* ── Main Content Grid ─────────────────────────────────── */}
          <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:gap-10 items-stretch">
            {/* Cột trái: 4 Kênh liên hệ trực tiếp */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-6">
              <div className="grid gap-3.5 sm:grid-cols-2">
                {/* 1. Hotline */}
                <a
                  href={CONTACT.phoneHref}
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-all duration-300 hover:border-gold/50 hover:bg-white/[0.07] hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/20 text-gold shadow-xs">
                      <Phone className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] text-cream/50 group-hover:text-gold transition-colors">
                      Gọi ngay ↗
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-medium text-cream/60">Hotline & Đặt hàng nhanh</p>
                    <p className="mt-1 text-base sm:text-lg font-bold text-cream tracking-wide">
                      {CONTACT.phoneDisplay}
                    </p>
                    <p className="mt-1 text-[11px] text-cream/50 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gold/70" /> 8:30 – 22:00 (Hằng ngày)
                    </p>
                  </div>
                </a>

                {/* 2. Zalo Tư vấn */}
                <a
                  href={CONTACT.zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-all duration-300 hover:border-[#0084FF]/50 hover:bg-white/[0.07] hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0084FF]/20 text-[#0099FF] shadow-xs">
                      <Messenger className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] text-cream/50 group-hover:text-[#0099FF] transition-colors">
                      Nhắn Zalo ↗
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-medium text-cream/60">Hỗ trợ qua Zalo Official</p>
                    <p className="mt-1 text-base sm:text-lg font-bold text-cream">
                      {CONTACT.phoneDisplay}
                    </p>
                    <p className="mt-1 text-[11px] text-cream/50">
                      Tư vấn dáng người & ảnh thật sản phẩm
                    </p>
                  </div>
                </a>

                {/* 3. Facebook Fanpage */}
                <a
                  href={CONTACT.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-all duration-300 hover:border-[#1877F2]/50 hover:bg-white/[0.07] hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1877F2]/20 text-[#1877F2] shadow-xs">
                      <Facebook className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] text-cream/50 group-hover:text-[#1877F2] transition-colors">
                      Mở trang ↗
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-medium text-cream/60">Fanpage Facebook chính thức</p>
                    <p className="mt-1 text-base sm:text-lg font-bold text-cream truncate">
                      The Basic Concept
                    </p>
                    <p className="mt-1 text-[11px] text-cream/50">
                      Cập nhật lookbook & chương trình ưu đãi
                    </p>
                  </div>
                </a>

                {/* 4. Dịch vụ in áo & Shopee */}
                <Link
                  href="/in-ao"
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-all duration-300 hover:border-gold/50 hover:bg-white/[0.07] hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/20 text-gold shadow-xs">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] text-cream/50 group-hover:text-gold transition-colors">
                      Khám phá ↗
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-medium text-cream/60">Thiết kế & In áo theo yêu cầu</p>
                    <p className="mt-1 text-base sm:text-lg font-bold text-cream">
                      In áo cá nhân / nhóm
                    </p>
                    <p className="mt-1 text-[11px] text-cream/50">
                      Nhận in từ 1 chiếc, tự phối màu & ảnh
                    </p>
                  </div>
                </Link>
              </div>

              {/* Dải cam kết dịch vụ */}
              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <Shield className="h-4 w-4 text-gold" />
                  <span className="text-[11px] font-semibold text-cream">100% Chất lượng</span>
                  <span className="text-[10px] text-cream/50">Vải Cotton thoáng mát</span>
                </div>
                <div className="flex flex-col items-center gap-1 border-x border-white/10 px-1">
                  <Return className="h-4 w-4 text-gold" />
                  <span className="text-[11px] font-semibold text-cream">Đổi size 30 ngày</span>
                  <span className="text-[10px] text-cream/50">Hỗ trợ tận nơi</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Ship className="h-4 w-4 text-gold" />
                  <span className="text-[11px] font-semibold text-cream">Giao hàng COD</span>
                  <span className="text-[10px] text-cream/50">Kiểm tra khi nhận</span>
                </div>
              </div>
            </div>

            {/* Cột phải: Form Đăng ký nhận ưu đãi VIP & Thông tin mới */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-white/15 bg-white/[0.06] p-6 sm:p-8 backdrop-blur-xl shadow-inner">
              <div>
                <span className="eyebrow text-gold font-bold text-[10px]">ĐẶC QUYỀN THÀNH VIÊN</span>
                <h3 className="mt-1.5 font-serif text-xl sm:text-2xl font-semibold text-cream">
                  Nhận mã giảm giá 10%
                </h3>
                <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-cream/75">
                  Đăng ký email để nhận ngay mã ưu đãi <strong>10%</strong> cho đơn hàng đầu tiên, đồng thời là
                  người sớm nhất biết về các bộ sưu tập mới ra mắt.
                </p>
              </div>

              <div className="mt-6">
                {done ? (
                  <div className="rounded-2xl border border-gold/30 bg-gold/15 p-5 text-cream backdrop-blur-md fade-in">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-gold text-[#161210] font-bold text-xs shrink-0">
                        <Check className="h-4 w-4 stroke-[2.5]" />
                      </span>
                      <p className="text-sm font-semibold text-cream">
                        Đăng ký thành công!
                      </p>
                    </div>
                    <div className="mt-3.5 rounded-xl bg-black/40 p-3 border border-white/10 text-center">
                      <p className="text-[11px] text-cream/60">Mã ưu đãi chào mừng của bạn:</p>
                      <p className="text-base font-mono font-bold text-gold tracking-widest mt-0.5">
                        TBCWELCOME10
                      </p>
                    </div>
                    <p className="mt-2.5 text-[11px] text-cream/60 text-center">
                      Áp dụng cho mọi sản phẩm khi thanh toán tại website.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={onSubmit} className="flex flex-col gap-3">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/40" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập địa chỉ email của bạn…"
                        className="h-12 w-full rounded-full border border-white/20 bg-white/10 pl-11 pr-5 text-sm text-cream placeholder:text-cream/40 outline-none transition-colors focus:border-gold focus:bg-white/15"
                      />
                    </div>

                    <button
                      type="submit"
                      className="h-12 w-full rounded-full bg-gold px-6 text-sm font-bold text-[#161210] shadow-md transition-all duration-200 hover:bg-gold-soft active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <span>Đăng ký nhận ưu đãi</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                )}

                <p className="mt-4 text-[11px] text-cream/40 text-center flex items-center justify-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-gold/60" /> Chúng tôi cam kết bảo mật 100% và không gửi thư rác.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
