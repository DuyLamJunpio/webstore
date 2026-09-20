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

      <div className="relative z-10 flex w-full max-h-[90vh] flex-col overflow-hidden border border-line bg-white shadow-2xl sheet-up sm:max-w-2xl sm:pop">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e5e5] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="bg-[#8f633e] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="relative w-full overflow-hidden border border-[#e5e5e5] bg-white shadow-xs">
            <Image
              src="/images/size-guide.png"
              alt="Bảng size áo chuẩn The Basic Concept"
              width={1024}
              height={704}
              priority
              className="w-full h-auto object-contain"
            />
          </div>

          <div className="border border-[#e5e5e5] bg-[#f7f7f7] p-4 text-xs sm:text-[13px] leading-relaxed text-[#555555]">
            <p className="font-bold uppercase tracking-wide text-ink mb-1.5">Mẹo chọn kích cỡ vừa vặn:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Nếu số đo của bạn nằm giữa 2 size, hãy chọn size lớn hơn nếu thích mặc thoải mái (oversized).</li>
              <li>Số đo có thể chênh lệch 1–2cm do phương pháp đo thủ công.</li>
              <li>Nếu cần hỗ trợ tư vấn dáng người cụ thể, đừng ngần ngại nhắn tin cho shop qua Zalo hoặc Fanpage!</li>
            </ul>
          </div>
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
