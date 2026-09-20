import Link from "next/link";
import { CONTACT } from "@/lib/contact";
import { footerNav } from "@/lib/data";
import Logo from "./Logo";
import { ArrowUpRight, Facebook, Phone } from "./icons";

const payments = ["VietQR", "Visa", "Mastercard", "JCB", "Momo", "VNPay"];

export default function Footer() {
  return (
    <footer className="border-t border-[#e5e5e5] bg-[#f7f7f7] text-[#1b1b1b] pb-24 lg:pb-0">
      <div className="shell py-12 md:py-16">
        {/* ── Brand & Navigation Grid ───────────────────────────── */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] lg:gap-14">
          <div>
            <Logo variant="stacked" align="left" />
            <p className="mt-5 max-w-sm text-xs sm:text-sm leading-relaxed text-[#555555]">
              <strong>LifeWear:</strong> Trang phục thường ngày được hoàn thiện từ sự tinh tế, chất lượng cao cấp và không ngừng đổi mới nhằm mang lại sự thoải mái nhất cho cuộc sống của bạn.
            </p>

            {/* Support hotline */}
            <div className="mt-7 border-t border-[#e5e5e5] pt-6">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#e60012]">
                HỖ TRỢ KHÁCH HÀNG
              </p>
              <a
                href={CONTACT.phoneHref}
                className="mt-2 inline-flex items-center gap-2 text-xl sm:text-2xl font-black tracking-tight text-black transition-colors hover:text-[#e60012]"
              >
                <Phone className="h-4 w-4 text-[#e60012]" />
                <span>{CONTACT.phoneDisplay}</span>
              </a>
              <p className="mt-1 text-xs text-[#777777]">
                Thứ Hai – Chủ Nhật: 08:30 – 21:30 (Trừ ngày Lễ)
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a
                  href={CONTACT.zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center border border-black/20 bg-white px-3.5 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:border-black hover:bg-black hover:text-white"
                >
                  Nhắn Zalo
                </a>
                <a
                  href={CONTACT.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 border border-black/20 bg-white px-3.5 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:border-black hover:bg-black hover:text-white"
                >
                  <Facebook className="h-3.5 w-3.5" />
                  <span>Fanpage</span>
                </a>
                <Link
                  href="/#newsletter"
                  className="inline-flex h-8 items-center gap-1.5 border border-[#e60012] bg-[#e60012] px-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#cc0010]"
                >
                  <span>Coupon 100K</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Nav columns */}
          <div className="grid gap-8 grid-cols-2 lg:grid-cols-4">
            {footerNav.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h3 className="text-xs font-black uppercase tracking-wider text-black pb-3 border-b border-[#e5e5e5]">
                  {column.title}
                </h3>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {column.links.map((link) => {
                    const style =
                      "text-xs sm:text-sm text-[#555555] transition-colors hover:text-[#e60012] hover:underline";
                    if (link.href.startsWith("/")) {
                      return (
                        <li key={link.label}>
                          <Link href={link.href} className={style}>
                            {link.label}
                          </Link>
                        </li>
                      );
                    }

                    const opensTab = link.href.startsWith("http");
                    return (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className={style}
                          {...(opensTab
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                        >
                          {link.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* ── Sub-footer / Legal & Payments ─────────────────────── */}
        <div className="mt-12 flex flex-col gap-5 border-t border-[#e5e5e5] pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-[#777777]">
            <span className="font-bold uppercase tracking-wider text-black">
              KHU VỰC: VIỆT NAM / TIẾNG VIỆT
            </span>
            <span className="hidden sm:inline text-line">|</span>
            <span>
              © {new Date().getFullYear()} THE BASIC CONCEPT. ALL RIGHTS RESERVED. LIFEWEAR.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
              Phương thức thanh toán:
            </span>
            {payments.map((label) => (
              <span
                key={label}
                className="border border-[#d5d5d5] bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

