"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";

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
      <div className="relative overflow-hidden rounded-block bg-ink">
        <Image
          src="/images/newsletter.png"
          alt=""
          aria-hidden
          fill
          sizes="(max-width: 1400px) 100vw, 1360px"
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/40" />

        <div className="relative px-6 py-14 text-cream sm:px-12 md:py-20 xl:px-20">
          <div className="max-w-xl">
            <h2 className="font-serif text-[clamp(2.25rem,4vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.015em]">
              Đăng ký nhận tin
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-cream/75">
              Là người đầu tiên biết về hàng mới về, ưu đãi riêng và gợi ý phối đồ được gửi thẳng
              vào hộp thư của bạn.
            </p>

            <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <label htmlFor="newsletter-email" className="sr-only">
                Địa chỉ email
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Nhập email của bạn"
                className="h-12 flex-1 rounded-full border border-cream/25 bg-cream/10 px-5 text-[15px] text-cream placeholder:text-cream/50 outline-none transition-colors focus:border-gold"
              />
              <button
                type="submit"
                className="h-12 rounded-full bg-cream px-7 text-sm font-medium text-ink transition-transform duration-300 hover:-translate-y-0.5"
              >
                Đăng ký
              </button>
            </form>

            <p className="mt-4 min-h-5 text-[13px] text-cream/70" role="status">
              {done ? "Cảm ơn bạn — hãy kiểm tra hộp thư để xác nhận đăng ký." : ""}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
