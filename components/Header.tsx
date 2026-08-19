"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import Logo from "./Logo";
import { Bag, Close, Heart, Menu, Search } from "./icons";

const links = [
  { label: "Cửa hàng", href: "/shop" },
  { label: "Hàng mới", href: "/shop?new=1" },
  { label: "Bài viết", href: "/#journal" },
  { label: "Liên hệ", href: "/#newsletter" },
];

function Counter({ value }: { value: number }) {
  return (
    <span className="absolute -right-1.5 -top-1.5 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-gold px-1 text-[9px] font-semibold leading-none text-cream">
      {value}
    </span>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { count, hydrated, openCart } = useCart();
  const showSolidHeader = scrolled || searchOpen;

  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById("top");
      const threshold = hero ? hero.offsetHeight - 120 : window.innerHeight * 0.8;
      setScrolled(window.scrollY > threshold);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("q");
    const value = typeof query === "string" ? query.trim() : "";
    router.push(value ? `/shop?q=${encodeURIComponent(value)}` : "/shop");
    setSearchOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        showSolidHeader
          ? "border-b border-line bg-cream/85 text-ink backdrop-blur-xl"
          : "bg-transparent text-cream"
      }`}
    >
      <div className="shell">
        <div className="flex h-[76px] items-center justify-between gap-6">
          <Link href="/" className="shrink-0" aria-label="The Basic Concept — trang chủ">
            <Logo variant="inline" />
          </Link>

          <nav className="hidden items-center gap-9 lg:flex" aria-label="Điều hướng chính">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`eyebrow relative py-1 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-right after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 ${
                  showSolidHeader
                    ? "text-ink/75 hover:text-ink hover:after:origin-left hover:after:scale-x-100"
                    : "text-cream/80 hover:text-cream hover:after:origin-left hover:after:scale-x-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Tìm kiếm"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((v) => !v)}
              className={`grid h-10 w-10 place-items-center rounded-full transition-colors ${
                showSolidHeader ? "hover:bg-ink/5" : "hover:bg-white/10"
              }`}
            >
              {searchOpen ? <Close /> : <Search />}
            </button>
            <Link
              href="/shop?sale=1"
              aria-label="Yêu thích, 0 sản phẩm"
              className={`relative hidden h-10 w-10 place-items-center rounded-full transition-colors sm:grid ${
                showSolidHeader ? "hover:bg-ink/5" : "hover:bg-white/10"
              }`}
            >
              <Heart />
              <Counter value={0} />
            </Link>
            <button
              type="button"
              onClick={openCart}
              aria-label={`Giỏ hàng, ${hydrated ? count : 0} sản phẩm`}
              className={`relative grid h-10 w-10 place-items-center rounded-full transition-colors ${
                showSolidHeader ? "hover:bg-ink/5" : "hover:bg-white/10"
              }`}
            >
              <Bag />
              <Counter value={hydrated ? count : 0} />
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Đóng menu" : "Mở menu"}
              aria-expanded={open}
              className={`grid h-10 w-10 place-items-center rounded-full transition-colors lg:hidden ${
                showSolidHeader ? "hover:bg-ink/5" : "hover:bg-white/10"
              }`}
            >
              {open ? <Close /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-line bg-cream/95 backdrop-blur-xl">
          <form onSubmit={submitSearch} className="shell flex items-center gap-3 py-4" role="search">
            <Search className="h-5 w-5 shrink-0 text-muted" />
            <input
              ref={searchRef}
              type="search"
              name="q"
              placeholder="Tìm áo hoodie, áo khoác, quần jeans…"
              aria-label="Tìm kiếm sản phẩm"
              className="h-10 flex-1 bg-transparent text-base outline-none placeholder:text-muted/70"
            />
            <button
              type="submit"
              className="h-10 shrink-0 rounded-full bg-ink px-5 text-sm font-medium text-cream transition-opacity hover:opacity-90"
            >
              Tìm
            </button>
          </form>
        </div>
      )}

      {open && (
        <div className="border-t border-line bg-cream lg:hidden">
          <nav className="shell flex flex-col py-2" aria-label="Điều hướng trên di động">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-4 text-lg font-medium last:border-none"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
