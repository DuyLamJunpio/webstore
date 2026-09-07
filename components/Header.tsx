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
  { label: "Sản phẩm", href: "/shop" },
  {
    label: "UP TO 50% OFF + EXTRA 25% OFF",
    href: "/shop?sale=1",
    highlight: true,
  },
  { label: "Hàng mới", href: "/shop?new=1" },
  { label: "In thiết kế theo yêu cầu", href: "/in-ao" },
  { label: "Bài viết", href: "/#journal" },
  { label: "Liên hệ", href: "/#newsletter" },
];

const searchTags = ["Áo hoodie", "Áo khoác", "Quần jeans", "Đồ len", "Hàng mới"];

function Counter({ value }: { value: number }) {
  return (
    <span className="absolute -right-1 -top-1 grid h-[16px] min-w-[16px] place-items-center rounded-full bg-gold px-1 text-[9px] font-bold leading-none text-cream shadow-xs transition-transform">
      {value}
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { count, hydrated, openCart } = useCart();
  const printDrafts = usePrintDrafts();
  const cartCount = hydrated ? count + printDraftQty(printDrafts) : 0;

  // Trang chủ: pathname === "/" hoặc rỗng/null khi SSR/hydration
  const isHome = !pathname || pathname === "/" || pathname === "";
  const showSolidHeader = !isHome || scrolled || searchOpen || open;

  useEffect(() => {
    if (!isHome) {
      return;
    }

    const checkScroll = () => {
      const hero = document.getElementById("top");
      const heroHeight = hero ? hero.offsetHeight : (typeof window !== "undefined" ? window.innerHeight : 600);
      const threshold = Math.max(heroHeight - 80, 200);
      setScrolled(window.scrollY > threshold);
    };

    // Kiểm tra vị trí cuộn ngay lập tức khi mount
    checkScroll();
    window.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      window.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [isHome]);

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

  const actionBtnClass = `relative grid h-10 w-10 place-items-center rounded-full transition-all duration-200 ${
    showSolidHeader
      ? "text-ink hover:bg-ink/5"
      : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] hover:bg-white/15"
  }`;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          showSolidHeader
            ? "border-b border-line bg-cream/90 text-ink backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
            : "bg-[linear-gradient(to_bottom,rgba(0,0,0,0.4),rgba(0,0,0,0.1),rgba(0,0,0,0))] text-white backdrop-blur-[1px]"
        }`}
      >
        <div className="shell">
          <div className="flex h-[72px] items-center justify-between gap-4">
            <Link
              href="/"
              className="shrink-0 transition-opacity hover:opacity-90"
              aria-label="The Basic Concept — trang chủ"
            >
              <Logo variant="inline" />
            </Link>

            <nav className="hidden items-center gap-5 xl:gap-7 lg:flex" aria-label="Điều hướng chính">
              {links.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                if (link.highlight) {
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`relative inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase transition-all duration-300 whitespace-nowrap shadow-xs hover:scale-105 active:scale-95 ${
                        showSolidHeader
                          ? "bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-sm hover:shadow-md"
                          : "bg-white/95 text-ink shadow-md hover:bg-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                      }`}
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400"></span>
                      </span>
                      <span>{link.label}</span>
                    </Link>
                  );
                }
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`eyebrow relative py-1.5 transition-colors whitespace-nowrap ${
                      showSolidHeader
                        ? isActive
                          ? "text-ink font-bold"
                          : "text-ink/75 hover:text-ink"
                        : isActive
                          ? "text-white font-bold"
                          : "text-white/90 hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-gold" />
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

        {/* ── Tìm kiếm nâng cao có gợi ý ────────────────────────────── */}
        {searchOpen && (
          <div className="border-t border-line bg-cream/98 backdrop-blur-2xl shadow-lg fade-in">
            <div className="shell py-5">
              <form onSubmit={onFormSubmit} className="flex items-center gap-3" role="search">
                <Search className="h-5 w-5 shrink-0 text-muted" />
                <input
                  ref={searchRef}
                  type="search"
                  name="q"
                  placeholder="Tìm áo hoodie, áo khoác, quần jeans, sơ mi…"
                  aria-label="Tìm kiếm sản phẩm"
                  className="h-11 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted/65"
                />
                <button
                  type="submit"
                  className="h-10 shrink-0 rounded-full bg-ink px-6 text-sm font-medium text-cream transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Tìm
                </button>
              </form>

              <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
                <span className="text-xs font-medium text-muted">Gợi ý:</span>
                {searchTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => submitSearch(tag)}
                    className="rounded-full bg-surface border border-line px-3 py-1 text-xs text-ink/80 transition-colors hover:border-ink hover:text-ink"
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
            className="absolute inset-0 bg-ink/50 backdrop-blur-xs fade-in"
            onClick={() => setOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 flex w-[min(85vw,360px)] flex-col bg-cream shadow-2xl sheet-up">
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <Logo variant="inline" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng menu"
                className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-ink/5"
              >
                <Close />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-6 py-6" aria-label="Điều hướng trên di động">
              <div className="flex flex-col gap-1">
                {links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium transition-colors ${
                      link.highlight
                        ? "bg-rose-50 border border-rose-200 text-rose-700 font-bold hover:bg-rose-100"
                        : "text-ink hover:bg-surface"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {link.highlight && (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                        </span>
                      )}
                      <span>{link.label}</span>
                    </span>
                    <ArrowUpRight className={`h-4 w-4 ${link.highlight ? "text-rose-600" : "text-muted"}`} />
                  </Link>
                ))}
              </div>

              <div className="mt-8 border-t border-line pt-6">
                <p className="eyebrow text-gold">Danh mục nổi bật</p>
                <div className="mt-3 flex flex-col gap-1">
                  <Link
                    href="/shop?new=1"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-ink/80 hover:bg-surface"
                  >
                    <Sparkles className="h-4 w-4 text-gold" />
                    Hàng mới về
                  </Link>
                  <Link
                    href="/shop?sale=1"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-ink/80 hover:bg-surface"
                  >
                    <Heart className="h-4 w-4 text-gold-deep" />
                    Đang ưu đãi
                  </Link>
                </div>
              </div>

              <div className="mt-8 border-t border-line pt-6">
                <p className="eyebrow text-muted">Hỗ trợ khách hàng</p>
                <a
                  href={CONTACT.phoneHref}
                  className="mt-3 flex items-center gap-2.5 px-4 text-sm font-semibold text-ink"
                >
                  <Phone className="h-4 w-4 text-gold" />
                  {CONTACT.phoneDisplay}
                </a>
                <div className="mt-3 flex gap-2 px-4">
                  <a
                    href={CONTACT.zaloUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink"
                  >
                    Nhắn Zalo
                  </a>
                  <a
                    href={CONTACT.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink"
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
