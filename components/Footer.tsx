import Link from "next/link";
import { CONTACT } from "@/lib/contact";
import { footerNav } from "@/lib/data";
import Logo from "./Logo";
import { ArrowUpRight, Facebook, Phone } from "./icons";

const payments = ["VietQR", "Visa", "Mastercard", "JCB", "Momo", "VNPay"];

export default function Footer() {
  return (
    <footer className="bg-ink text-cream pb-24 lg:pb-0">
      <div className="shell py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
          <div>
            <Logo variant="stacked" align="left" />
            <p className="mt-6 max-w-xs text-xs sm:text-sm leading-relaxed text-cream/65">
              Thời trang thiết kế tối giản, sản xuất số lượng giới hạn từ chất liệu cao cấp và an toàn cho làn da.
            </p>

            <div className="mt-8">
              <p className="text-sm font-semibold text-cream">Đăng ký nhận ưu đãi</p>
              <p className="mt-1.5 max-w-xs text-xs sm:text-sm leading-relaxed text-cream/60">
                Nhận thông báo về hàng mới về, ưu đãi riêng và mã giảm giá đặc biệt.
              </p>
              <Link
                href="/#newsletter"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-cream/30 bg-cream/5 px-5 text-xs sm:text-sm font-semibold text-cream shadow-xs transition-transform hover:scale-105 hover:border-gold hover:bg-gold hover:text-cream active:scale-95"
              >
                <span>Đăng ký ngay</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-8">
              <p className="eyebrow text-gold font-bold">Chăm Sóc Khách Hàng</p>

              <a
                href={CONTACT.phoneHref}
                className="mt-3 inline-flex items-center gap-2.5 text-base sm:text-lg font-bold text-cream transition-colors hover:text-gold"
              >
                <Phone className="h-4 w-4 text-gold" />
                <span>{CONTACT.phoneDisplay}</span>
              </a>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={CONTACT.zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center rounded-full border border-cream/25 bg-cream/5 px-3.5 text-xs font-medium text-cream/90 transition-colors hover:border-gold hover:text-gold"
                >
                  Nhắn Zalo
                </a>
                <a
                  href={CONTACT.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-cream/25 bg-cream/5 px-3.5 text-xs font-medium text-cream/90 transition-colors hover:border-gold hover:text-gold"
                >
                  <Facebook className="h-3.5 w-3.5" />
                  <span>Fanpage</span>
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-8 grid-cols-2 lg:grid-cols-4">
            {footerNav.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h3 className="eyebrow text-gold font-bold">{column.title}</h3>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {column.links.map((link) => {
                    const style = "text-xs sm:text-sm text-cream/70 transition-colors hover:text-gold";
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

        <div className="mt-12 flex flex-col gap-5 border-t border-cream/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-cream/50">
            © {new Date().getFullYear()} The Basic Concept. Tất cả các quyền được bảo lưu.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-cream/50">Thanh toán an toàn:</span>
            {payments.map((label) => (
              <span
                key={label}
                className="rounded-md border border-cream/15 bg-cream/5 px-2 py-0.5 text-[10px] font-semibold text-cream/70"
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

