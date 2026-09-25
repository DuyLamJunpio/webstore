"use client";

import Image from "next/image";
import { useState } from "react";

export interface SizeGuideTabsProps {
  defaultTab?: "adult" | "kids";
  className?: string;
  showTips?: boolean;
}

export default function SizeGuideTabs({
  defaultTab = "adult",
  className = "",
  showTips = true,
}: SizeGuideTabsProps) {
  const [tab, setTab] = useState<"adult" | "kids">(defaultTab);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* ── Thanh chuyển đổi Tab ── */}
      <div className="flex border-b border-[#e5e5e5] bg-[#f9f9f9]" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "adult"}
          onClick={() => setTab("adult")}
          className={`flex-1 py-3 px-4 text-center text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
            tab === "adult"
              ? "border-[#8f633e] bg-white text-[#8f633e] font-black shadow-2xs"
              : "border-transparent text-[#777777] hover:text-ink hover:bg-black/2"
          }`}
        >
          Áo Người Lớn
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "kids"}
          onClick={() => setTab("kids")}
          className={`flex-1 py-3 px-4 text-center text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
            tab === "kids"
              ? "border-[#8f633e] bg-white text-[#8f633e] font-black shadow-2xs"
              : "border-transparent text-[#777777] hover:text-ink hover:bg-black/2"
          }`}
        >
          Áo Trẻ Em
        </button>
      </div>

      {/* ── Nội dung Bảng Size ── */}
      <div className="p-4 sm:p-6 space-y-4 bg-white">
        <div className="relative w-full overflow-hidden border border-[#e5e5e5] bg-white shadow-xs">
          {tab === "adult" ? (
            <Image
              src="/images/size-guide.png"
              alt="Bảng size áo người lớn chuẩn The Basic Concept"
              width={1024}
              height={704}
              priority
              className="w-full h-auto object-contain"
            />
          ) : (
            <Image
              src="/images/size-guide-kids.png"
              alt="Bảng size áo trẻ em chuẩn The Basic Concept"
              width={1024}
              height={682}
              priority
              className="w-full h-auto object-contain"
            />
          )}
        </div>

        {showTips && (
          <div className="border border-[#e5e5e5] bg-[#f7f7f7] p-4 text-xs sm:text-[13px] leading-relaxed text-[#555555]">
            <p className="font-bold uppercase tracking-wide text-ink mb-1.5">
              {tab === "adult" ? "Mẹo chọn kích cỡ vừa vặn:" : "Lưu ý chọn size cho bé:"}
            </p>
            {tab === "adult" ? (
              <ul className="list-disc pl-4 space-y-1">
                <li>Nếu số đo của bạn nằm giữa 2 size, hãy chọn size lớn hơn nếu thích mặc thoải mái (oversized).</li>
                <li>Số đo có thể chênh lệch 1–2cm do phương pháp đo thủ công.</li>
                <li>Nếu cần hỗ trợ tư vấn dáng người cụ thể, đừng ngần ngại nhắn tin cho shop qua Zalo hoặc Fanpage!</li>
              </ul>
            ) : (
              <ul className="list-disc pl-4 space-y-1">
                <li>Đơn vị: cm · Cân nặng là khuyến nghị theo thể trạng trung bình — chọn size lớn hơn nếu bé có dáng cao hoặc đầy đặn.</li>
                <li>Trẻ em đang tuổi lớn nhanh, nếu phân vân giữa 2 size nên ưu tiên chọn tăng 1 size để bé mặc thoải mái lâu dài.</li>
                <li>Số đo có thể chênh lệch 1–2cm do phương pháp đo thủ công.</li>
                <li>Nếu ba mẹ cần tư vấn thêm về kích thước cho bé, vui lòng nhắn tin trực tiếp cho shop để được hỗ trợ chu đáo nhất!</li>
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
