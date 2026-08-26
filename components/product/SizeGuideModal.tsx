"use client";

import Image from "next/image";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Close, Sparkles } from "../icons";

export default function SizeGuideModal({ onClose }: { onClose: () => void }) {
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

      <div className="relative z-10 flex w-full max-h-[90vh] flex-col overflow-hidden rounded-t-[24px] bg-cream shadow-2xl sheet-up sm:max-w-2xl sm:rounded-3xl sm:pop">
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-ink/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <h2 className="text-base sm:text-lg font-semibold text-ink">
              Bảng Hướng Dẫn Chọn Size
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng size"
            className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <Close />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="relative w-full overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <Image
              src="/images/size-guide.png"
              alt="Bảng size áo chuẩn The Basic Concept"
              width={1024}
              height={704}
              priority
              className="w-full h-auto object-contain"
            />
          </div>

          <div className="rounded-2xl bg-surface p-4 text-xs sm:text-[13px] leading-relaxed text-muted border border-line/70">
            <p className="font-semibold text-ink mb-1.5">💡 Mẹo chọn size vừa vặn:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Nếu số đo của bạn nằm giữa 2 size, hãy chọn size lớn hơn nếu thích mặc thoải mái (oversized).</li>
              <li>Số đo có thể chênh lệch 1–2cm do phương pháp đo thủ công.</li>
              <li>Nếu cần hỗ trợ tư vấn dáng người cụ thể, đừng ngần ngại nhắn tin cho shop qua Zalo hoặc Fanpage!</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-line bg-surface/60 px-5 py-3.5 pb-safe text-center">
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full sm:w-auto sm:px-8 rounded-full bg-ink text-sm font-semibold text-cream transition-transform active:scale-95 shadow-xs"
          >
            Đã hiểu, quay lại chọn size
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
