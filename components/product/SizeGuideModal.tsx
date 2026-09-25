"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Close } from "../icons";
import SizeGuideTabs from "./SizeGuideTabs";

export interface SizeGuideModalProps {
  onClose: () => void;
  initialTab?: "adult" | "kids";
}

export default function SizeGuideModal({
  onClose,
  initialTab = "adult",
}: SizeGuideModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-80 flex flex-col justify-end sm:grid sm:place-items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Bảng hướng dẫn chọn size"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 bg-ink/60 backdrop-blur-sm fade-in"
      />

      <div className="relative z-10 flex w-full max-h-[92vh] flex-col overflow-hidden border border-line bg-white shadow-2xl sheet-up sm:max-w-2xl sm:pop">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e5e5] px-5 py-3.5 sm:px-6 bg-white">
          <div className="flex items-center gap-2">
            <span className="bg-[#8f633e] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-2xs">
              LIFEWEAR SIZE
            </span>
            <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-ink">
              BẢNG HƯỚNG DẪN CHỌN SIZE
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng size"
            className="grid h-8 w-8 place-items-center text-ink transition-colors hover:bg-black/5"
          >
            <Close className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <SizeGuideTabs defaultTab={initialTab} />
        </div>

        {/* Footer */}
        <div className="border-t border-[#e5e5e5] bg-[#f7f7f7] px-5 py-3.5 pb-safe text-center">
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full sm:w-auto sm:px-8 border border-black bg-black text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#8f633e] active:scale-95 shadow-xs"
          >
            ĐÃ HIỂU, QUAY LẠI CHỌN SIZE
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
