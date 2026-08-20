"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { CONTACT } from "@/lib/contact";
import { Close, Facebook, Phone } from "./icons";

export default function FloatingContact() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isProductPage = pathname.startsWith("/products/");

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

      {/* ── Nút chính kích hoạt Speed Dial ────────────────────────── */}
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
  );
}

