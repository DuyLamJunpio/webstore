import Link from "next/link";
import { CONTACT } from "@/lib/contact";
import { footerNav } from "@/lib/data";
import Logo from "./Logo";
import { ArrowUpRight, Facebook, Phone } from "./icons";

const payments = ["Visa", "Mastercard", "JCB", "Momo", "VNPay"];

export default function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="shell py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
          <div>
            <Logo variant="stacked" align="left" />
            <p className="mt-7 max-w-xs text-sm leading-relaxed text-cream/60">
              Đồ cơ bản được chọn lọc kỹ cho nam, nữ và trẻ em — sản xuất số lượng nhỏ từ nguyên
              liệu có nguồn gốc trách nhiệm.
            </p>

            <div className="mt-8">
              <p className="text-sm font-medium">Đăng ký nhận tin</p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-cream/60">
                Biết sớm về hàng mới về, ưu đãi riêng và cập nhật phong cách theo mùa.
              </p>
              <Link
                href="/#newsletter"
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border border-cream/25 px-5 text-sm font-medium transition-colors hover:bg-gold hover:border-gold hover:text-cream"
              >
                Đăng ký
                <ArrowUpRight />
              </Link>
            </div>

            <div className="mt-10">
              <p className="eyebrow text-gold">Liên hệ</p>

              <a
                href={CONTACT.phoneHref}
                className="mt-4 inline-flex items-center gap-2.5 text-lg font-medium transition-colors hover:text-gold"
              >
                <Phone className="h-[18px] w-[18px] text-gold" />
                {CONTACT.phoneDisplay}
              </a>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <a
                  href={CONTACT.zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center rounded-full border border-cream/25 px-3.5 text-[13px] font-medium transition-colors hover:border-gold hover:text-gold"
                >
                  Nhắn Zalo
                </a>
                <a
                  href={CONTACT.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-cream/25 px-3.5 text-[13px] font-medium transition-colors hover:border-gold hover:text-gold"
                >
                  <Facebook className="h-4 w-4" />
                  Fanpage
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {footerNav.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h3 className="eyebrow text-gold">{column.title}</h3>
                <ul className="mt-5 flex flex-col gap-3">
                  {column.links.map((link) => {
                    const style = "text-sm text-cream/70 transition-colors hover:text-gold";
                    // Ba loại đích khác nhau, không gộp được:
                    //   "/..."   điều hướng trong ứng dụng → next/link
                    //   "http.." sang trang khác → tab mới, kèm `noopener` để
                    //            trang đích không với tới `window.opener`
                    //   "tel:"   giao cho hệ điều hành → thẻ a, cùng tab
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

        <div className="mt-14 flex flex-col gap-6 border-t border-cream/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-cream/50">
            © {new Date().getFullYear()} The Basic Concept. Bảo lưu mọi quyền.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-cream/45">Thanh toán bảo mật qua</span>
            {payments.map((label) => (
              <span
                key={label}
                className="rounded-md border border-cream/15 px-2.5 py-1 text-[11px] text-cream/65"
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
