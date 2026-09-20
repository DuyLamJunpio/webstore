"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CONTACT } from "@/lib/contact";
import { Close, Facebook, Phone } from "./icons";

export default function FloatingContact() {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const isHoveredRef = useRef(false);
  const pathname = usePathname();
  const isProductPage = pathname.startsWith("/products/");

  // Cứ mỗi 3s tự động xổ ra dòng chữ "Liên hệ in áo ngay"
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let isMounted = true;

    const cycle = () => {
      if (!isMounted) return;
      setShowTooltip(true);

      // Hiển thị trong 3.5 giây rồi thu lại 1.5 giây trước khi xổ ra lượt tiếp theo
      timer = setTimeout(() => {
        if (!isMounted) return;
        if (!isHoveredRef.current) {
          setShowTooltip(false);
        }
        timer = setTimeout(cycle, 1500);
      }, 3500);
    };

    // Bắt đầu xổ ra sau 1 giây đầu tiên khi tải trang
    timer = setTimeout(cycle, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      className={`fixed right-3.5 z-35 flex flex-col items-end gap-2.5 print:hidden mb-safe transition-all duration-300 ${
        isProductPage ? "bottom-20 lg:bottom-6 lg:right-6" : "bottom-20 lg:bottom-6 lg:right-6"
      }`}
    >
      {/* ── Danh sách nút liên hệ khi mở rộng ─────────────────────── */}
      {open && (
        <div className="flex flex-col items-end gap-2.5 sheet-up">
          <a
            href={CONTACT.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Fanpage Facebook của The Basic Concept"
            className="group flex items-center gap-2.5 rounded-full bg-white py-1 pl-3.5 pr-1.5 text-xs font-semibold text-[#1877f2] shadow-md ring-1 ring-black/5 transition-transform hover:scale-105 active:scale-95"
          >
            <span>Nhắn Facebook</span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#1877f2] text-white">
              <Facebook className="h-4 w-4" />
            </span>
          </a>

          <a
            href={CONTACT.zaloUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Nhắn tin Zalo tới ${CONTACT.phoneDisplay}`}
            className="group flex items-center gap-2.5 rounded-full bg-white py-1 pl-3.5 pr-1.5 text-xs font-semibold text-[#0068ff] shadow-md ring-1 ring-black/5 transition-transform hover:scale-105 active:scale-95"
          >
            <span>Nhắn Zalo</span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0068ff] text-white text-[12px] font-black italic">
              Zalo
            </span>
          </a>

          <a
            href={CONTACT.phoneHref}
            aria-label={`Gọi ${CONTACT.phoneDisplay}`}
            className="group flex items-center gap-2.5 rounded-full bg-white py-1 pl-3.5 pr-1.5 text-xs font-semibold text-gold-deep shadow-md ring-1 ring-black/5 transition-transform hover:scale-105 active:scale-95"
          >
            <span>{CONTACT.phoneDisplay}</span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gold text-white">
              <Phone className="h-4 w-4" />
            </span>
          </a>
        </div>
      )}

      {/* ── Nút chính kích hoạt Speed Dial & Tooltip xổ ra ───────────── */}
      <div className="relative flex items-center">
        {/* ── Dòng chữ "Liên hệ in áo ngay" cứ 3s xổ ra sang bên trái ── */}
        {!open && (
          <div
            onClick={() => setOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setOpen(true);
            }}
            onMouseEnter={() => {
              isHoveredRef.current = true;
              setShowTooltip(true);
            }}
            onMouseLeave={() => {
              isHoveredRef.current = false;
            }}
            aria-label="Liên hệ in áo ngay"
            className={`absolute right-full mr-3.5 top-1/2 -translate-y-1/2 cursor-pointer select-none transition-all duration-500 ease-out ${
              showTooltip
                ? "opacity-100 translate-x-0 scale-100 pointer-events-auto"
                : "opacity-0 translate-x-3 scale-95 pointer-events-none"
            }`}
          >
            <div className="relative flex items-center gap-2 rounded-full bg-[#8f633e] px-4 py-2 text-xs font-bold text-white shadow-xl hover:bg-[#734d2c] transition-colors whitespace-nowrap">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span>Liên hệ in áo ngay</span>
              <span className="text-[11px] opacity-90">↗</span>

              {/* Mũi tên tam giác chỉ về nút điện thoại */}
              <span
                aria-hidden
                className="absolute -right-1.5 top-1/2 -translate-y-1/2 h-0 w-0 border-y-[5px] border-y-transparent border-l-[6px] border-l-[#8f633e]"
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Đóng menu liên hệ" : "Mở menu liên hệ hỗ trợ"}
          aria-expanded={open}
          className="group relative grid h-12 w-12 sm:h-13 sm:w-13 place-items-center rounded-full bg-ink text-cream shadow-xl ring-2 ring-gold/40 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {!open && (
            <span className="absolute -inset-1 animate-ping rounded-full bg-gold/25 opacity-75 duration-1000 pointer-events-none" />
          )}
          {open ? (
            <Close className="h-5 w-5 transition-transform duration-300 rotate-90" />
          ) : (
            <Phone className="h-5 w-5 text-gold-soft transition-transform duration-300 group-hover:rotate-12" />
          )}
        </button>
      </div>
    </div>
  );
}
