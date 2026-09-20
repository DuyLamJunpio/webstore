"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { CONTACT } from "@/lib/contact";
import { printDraftQty, usePrintDrafts } from "@/lib/print-draft";
import Logo from "./Logo";
import { ArrowUpRight, Bag, Close, Heart, Menu, Phone, Search, Sparkles } from "./icons";

type NavLink = {
  label: string;
  href: string;
  highlight?: boolean;
};

const links: NavLink[] = [
  { label: "NỮ", href: "/shop?audience=N%E1%BB%AF" },
  { label: "NAM", href: "/shop?audience=Nam" },
  { label: "TRẺ EM", href: "/shop?audience=Tr%E1%BA%BB%20em" },
  { label: "BỘ SƯU TẬP", href: "/shop" },
  {
    label: "KHUYẾN MÃI",
    href: "/shop?sale=1",
    highlight: true,
  },
  { label: "IN ÁO UTme!", href: "/in-ao" },
];

const searchTags = ["Áo thun Cotton", "Sơ mi công sở", "Quần jeans", "Áo chống nắng", "Đồ mặc nhà", "UTme!"];

function Counter({ value }: { value: number }) {
  return (
    <span className="absolute -right-1 -top-1 grid h-[16px] min-w-[16px] place-items-center bg-[#e60012] px-1 text-[9px] font-bold leading-none text-white shadow-xs">
      {value}
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { count, hydrated, openCart } = useCart();
  const printDrafts = usePrintDrafts();
  const cartCount = hydrated ? count + printDraftQty(printDrafts) : 0;

  const isHome = pathname === "/";
  const isTransparent = isHome && !isScrolled && !open && !searchOpen;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const submitSearch = (queryText?: string) => {
    const value = queryText !== undefined ? queryText.trim() : (searchRef.current?.value || "").trim();
    if (value) {
      router.push(`/shop?q=${encodeURIComponent(value)}`);
    } else {
      router.push("/shop");
    }
    setSearchOpen(false);
  };

  const onFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSearch();
  };

  const actionBtnClass = isTransparent
    ? "relative grid h-10 w-10 place-items-center text-white transition-colors hover:bg-white/15 active:bg-white/20"
    : "relative grid h-10 w-10 place-items-center text-ink transition-colors hover:bg-black/5 active:bg-black/10";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          isTransparent
            ? "border-b border-white/15 bg-transparent text-white"
            : "border-b border-line bg-white/98 text-ink backdrop-blur-md shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
        }`}
      >
        {/* ── Top Utility Bar kiểu UNIQLO ───────────────────────────── */}
        <div
          className={`hidden border-b py-1 text-[11px] transition-colors duration-300 md:block ${
            isTransparent
              ? "border-white/10 bg-transparent text-white/80"
              : "border-line bg-[#f7f7f7] text-[#555555]"
          }`}
        >
          <div className="shell flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`font-semibold ${isTransparent ? "text-white" : "text-[#e60012]"}`}>
                MIỄN PHÍ VẬN CHUYỂN
              </span>
              <span className={isTransparent ? "text-white/40" : "text-line-strong"}>•</span>
              <span>Đơn hàng từ 499.000đ</span>
              <span className={isTransparent ? "text-white/40" : "text-line-strong"}>•</span>
              <span>Đăng ký thành viên nhận Coupon 100.000đ</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <Link
                href="/#promises"
                className={`transition-colors ${isTransparent ? "hover:text-white" : "hover:text-ink"}`}
              >
                Hệ thống cửa hàng
              </Link>
              <span className={isTransparent ? "text-white/40" : "text-line-strong"}>•</span>
              <Link
                href="/#newsletter"
                className={`transition-colors ${isTransparent ? "hover:text-white" : "hover:text-ink"}`}
              >
                Trợ giúp
              </Link>
              <span className={isTransparent ? "text-white/40" : "text-line-strong"}>•</span>
              <span className={`font-bold ${isTransparent ? "text-white" : "text-ink"}`}>VN / EN</span>
            </div>
          </div>
        </div>

        {/* ── Main Navigation Bar ──────────────────────────────────── */}
        <div className="shell">
          <div className="flex h-[64px] sm:h-[70px] items-center justify-between gap-4">
            <Link
              href="/"
              className="shrink-0 transition-opacity hover:opacity-90"
              aria-label="The Basic Concept — LifeWear trang chủ"
            >
              <Logo variant="inline" light={isTransparent} />
            </Link>

            <nav className="hidden items-center gap-6 xl:gap-8 lg:flex" aria-label="Điều hướng chính">
              {links.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                if (link.highlight) {
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="relative inline-flex items-center gap-1.5 bg-[#e60012] px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-white shadow-2xs transition-transform hover:opacity-95 active:scale-98 whitespace-nowrap"
                    >
                      <span className="h-1.5 w-1.5 bg-white" />
                      <span>{link.label}</span>
                    </Link>
                  );
                }
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`relative py-2 text-[13px] font-bold tracking-[0.06em] uppercase transition-colors whitespace-nowrap ${
                      isTransparent
                        ? isActive
                          ? "text-white"
                          : "text-white/85 hover:text-white"
                        : isActive
                        ? "text-[#e60012]"
                        : "text-ink hover:text-[#e60012]"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span
                        className={`absolute inset-x-0 bottom-0 h-[2px] ${
                          isTransparent ? "bg-white" : "bg-[#e60012]"
                        }`}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                aria-label="Tìm kiếm"
                aria-expanded={searchOpen}
                onClick={() => setSearchOpen((v) => !v)}
                className={actionBtnClass}
              >
                {searchOpen ? <Close /> : <Search />}
              </button>

              <Link
                href="/shop?sale=1"
                aria-label="Khuyến mãi"
                className={`hidden sm:grid ${actionBtnClass}`}
              >
                <Heart />
              </Link>

              <button
                type="button"
                onClick={openCart}
                aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
                className={actionBtnClass}
              >
                <Bag />
                <Counter value={cartCount} />
              </button>

              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Đóng menu" : "Mở menu"}
                aria-expanded={open}
                className={`lg:hidden ${actionBtnClass}`}
              >
                {open ? <Close /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Khung tìm kiếm nâng cao chuẩn UNIQLO ──────────────────── */}
        {searchOpen && (
          <div className="border-t border-line bg-white shadow-lg fade-in">
            <div className="shell py-6">
              <form onSubmit={onFormSubmit} className="flex items-center gap-3 border-b-2 border-ink pb-2" role="search">
                <Search className="h-5 w-5 shrink-0 text-muted" />
                <input
                  ref={searchRef}
                  type="search"
                  name="q"
                  placeholder="Tìm theo sản phẩm, loại trang phục, màu sắc, từ khoá..."
                  aria-label="Tìm kiếm sản phẩm"
                  className="h-10 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted/65"
                />
                <button
                  type="submit"
                  className="h-9 shrink-0 bg-ink px-6 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#e60012]"
                >
                  Tìm kiếm
                </button>
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase text-muted">Từ khoá gợi ý:</span>
                {searchTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => submitSearch(tag)}
                    className="border border-line bg-[#f7f7f7] px-3 py-1 text-xs text-ink transition-colors hover:border-ink hover:bg-white"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Mobile Navigation Drawer ───────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs fade-in"
            onClick={() => setOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 flex w-[min(88vw,380px)] flex-col bg-white shadow-2xl sheet-up">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Logo variant="inline" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng menu"
                className="grid h-10 w-10 place-items-center text-ink hover:bg-black/5"
              >
                <Close />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-5 py-6" aria-label="Điều hướng trên di động">
              <div className="flex flex-col divide-y divide-line border-y border-line">
                {links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between py-4 text-sm font-bold tracking-wider uppercase transition-colors ${
                      link.highlight ? "text-[#e60012]" : "text-ink hover:text-[#e60012]"
                    }`}
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="h-4 w-4 text-muted" />
                  </Link>
                ))}
              </div>

              <div className="mt-8 border border-line bg-[#f7f7f7] p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#e60012]">Đặc quyền thành viên</p>
                <p className="mt-1 text-xs text-ink/80">
                  Tải ứng dụng hoặc đăng ký email để nhận mã giảm giá 100.000đ cho đơn hàng đầu tiên.
                </p>
                <Link
                  href="/#newsletter"
                  onClick={() => setOpen(false)}
                  className="mt-3 inline-block bg-ink px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#e60012]"
                >
                  Nhận ưu đãi ngay
                </Link>
              </div>

              <div className="mt-8 border-t border-line pt-6">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Hỗ trợ khách hàng</p>
                <a
                  href={CONTACT.phoneHref}
                  className="mt-3 flex items-center gap-2.5 text-sm font-bold text-ink"
                >
                  <Phone className="h-4 w-4 text-[#e60012]" />
                  {CONTACT.phoneDisplay}
                </a>
                <div className="mt-3 flex gap-2">
                  <a
                    href={CONTACT.zaloUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-line bg-white px-3 py-1 text-xs font-medium text-ink"
                  >
                    Nhắn Zalo
                  </a>
                  <a
                    href={CONTACT.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-line bg-white px-3 py-1 text-xs font-medium text-ink"
                  >
                    Fanpage
                  </a>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

