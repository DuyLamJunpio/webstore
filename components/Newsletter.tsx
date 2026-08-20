"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Check } from "./icons";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;
    setDone(true);
    setEmail("");
  };

  return (
    <section id="newsletter" className="shell section">
      <div className="relative overflow-hidden rounded-block bg-ink shadow-lg">
        <Image
          src="/images/newsletter.png"
          alt=""
          aria-hidden
          fill
          sizes="(max-width: 1400px) 100vw, 1360px"
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/80 to-ink/40" />

        <div className="relative px-6 py-12 text-cream sm:px-12 md:py-18 xl:px-20">
          <div className="max-w-xl">
            <span className="eyebrow text-gold-soft">Ưu Đãi Độc Quyền</span>
            <h2 className="mt-2 font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.015em]">
              Đăng ký nhận thông tin
            </h2>
            <p className="mt-3 text-sm sm:text-[15px] leading-relaxed text-cream/80">
              Nhận thông báo sớm nhất về các đợt hàng mới, ưu đãi riêng cho thành viên và cẩm nang phối đồ định kỳ.
            </p>

            {done ? (
              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-cream/15 p-4 text-cream backdrop-blur-md fade-in">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gold text-cream shrink-0">
                  <Check className="h-4 w-4" />
                </span>
                <p className="text-sm">
                  Cảm ơn bạn! Chúng tôi đã ghi nhận email của bạn.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <label htmlFor="newsletter-email" className="sr-only">
                  Địa chỉ email
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Nhập địa chỉ email của bạn…"
                  className="h-12 flex-1 rounded-full border border-cream/30 bg-cream/10 px-5 text-sm sm:text-[15px] text-cream placeholder:text-cream/50 outline-none transition-colors focus:border-gold"
                />
                <button
                  type="submit"
                  className="h-12 rounded-full bg-cream px-7 text-sm font-semibold text-ink shadow-md transition-transform duration-200 hover:scale-105 active:scale-95 shrink-0"
                >
                  Đăng ký ngay
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

