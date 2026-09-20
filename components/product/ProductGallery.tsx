"use client";

import { useMemo, useRef, useState } from "react";
import MediaFrame, { PlayBadge } from "@/components/MediaFrame";
import { Search } from "@/components/icons";
import type { Media } from "@/lib/data";
import ImageLightbox from "./ImageLightbox";
import { useSharedVariantSelection } from "./VariantSelectionProvider";

export default function ProductGallery({
  media,
  alt,
  badge,
}: {
  media: Media[];
  alt: string;
  badge?: string;
}) {
  const { styles, style, hasExplicitStyles } = useSharedVariantSelection();
  const [selection, setSelection] = useState({ styleId: style.id, index: 0 });
  const [zoomOpen, setZoomOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  /**
   * Chỉ đưa ảnh của mẫu đang chọn lên đầu. Danh sách mẫu có bộ chọn ảnh riêng,
   * nên gallery không phình theo số mẫu và vẫn giữ được giới hạn thumbnail cũ.
   */
  const displayedMedia = useMemo<Media[]>(() => {
    if (!hasExplicitStyles || !style.image) return media;

    const styleImages = new Set(styles.map((option) => option.image).filter(Boolean));
    return [
      { type: "image", src: style.image },
      // Ảnh của các mẫu khác đã có ở bộ chọn mẫu. Không lặp lại
      // chúng trong gallery, nếu không khách dễ nhầm ảnh nào thuộc mẫu đang mua.
      ...media.filter(
        (item) => item.type !== "image" || !styleImages.has(item.src),
      ),
    ];
  }, [hasExplicitStyles, media, style.image, styles]);

  // Khi style đổi, index của style trước không còn ý nghĩa. Dẫn xuất về 0 ngay
  // trong render để ảnh đổi cùng lượt, không cần một Effect + lượt render thứ hai.
  const selectedIndex = selection.styleId === style.id ? selection.index : 0;
  const activeIndex = Math.min(selectedIndex, Math.max(displayedMedia.length - 1, 0));
  const current = displayedMedia[activeIndex];
  const isVideo = current?.type === "video";

  const selectIndex = (index: number) => setSelection({ styleId: style.id, index });

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || displayedMedia.length < 2) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // swipe left -> next image
        selectIndex((activeIndex + 1) % displayedMedia.length);
      } else {
        // swipe right -> prev image
        selectIndex((activeIndex - 1 + displayedMedia.length) % displayedMedia.length);
      }
    }
    touchStartX.current = null;
  };

  return (
    <div className="flex flex-col-reverse gap-3 sm:gap-4 md:flex-row">
      {/* ── Thumbnails ── */}
      {displayedMedia.length > 1 && (
        <div
          className="flex gap-2.5 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0 scrollbar-none"
          role="tablist"
          aria-label="Ảnh sản phẩm"
        >
          {displayedMedia.map((item, index) => (
            <button
              key={`${item.type}:${item.src}`}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`${item.type === "video" ? "Xem video" : "Xem ảnh"} ${index + 1}`}
              onClick={() => selectIndex(index)}
              className={`relative aspect-square w-14 shrink-0 overflow-hidden border bg-white transition-all sm:w-16 md:w-20 ${
                index === activeIndex
                  ? "border-2 border-black"
                  : "border-[#e5e5e5] opacity-75 hover:opacity-100 hover:border-black"
              }`}
            >
              <MediaFrame media={item} alt="" sizes="80px" />
              {item.type === "video" && <PlayBadge className="absolute inset-0 m-auto h-6 w-6 sm:h-7 sm:w-7" />}
            </button>
          ))}
        </div>
      )}

      {/* ── Main Viewport ── */}
      <div
        className="group relative flex-1 overflow-hidden border border-[#e5e5e5] bg-white shadow-xs"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isVideo ? (
          <div className="relative aspect-[4/5]">
            <video
              key={current.src}
              src={current.src}
              controls
              playsInline
              preload="metadata"
              aria-label={`Video sản phẩm — ${alt}`}
              className="rise absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            aria-label={`Phóng to ảnh — ${alt}`}
            className="block w-full cursor-zoom-in"
          >
            <span className="relative block aspect-[4/5]">
              <MediaFrame
                key={current.src}
                media={current}
                alt={hasExplicitStyles ? `${alt} — ${style.name}` : alt}
                priority
                sizes="(max-width: 767px) 100vw, 560px"
                className="rise"
              />
            </span>

            <span
              aria-hidden
              className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center border border-black/15 bg-white text-ink shadow-xs transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100"
            >
              <Search className="h-4 w-4" />
            </span>
          </button>
        )}

        {badge && (
          <span className="pointer-events-none absolute left-3 top-3 bg-[#8f633e] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest leading-none text-white shadow-xs">
            {badge}
          </span>
        )}

        {/* ── Mobile Dash Indicators ── */}
        {displayedMedia.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1 md:hidden pointer-events-none">
            {displayedMedia.map((item, index) => (
              <span
                key={`${item.type}:${item.src}`}
                className={`h-0.5 transition-all duration-300 ${
                  index === activeIndex ? "w-5 bg-black" : "w-2 bg-black/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {zoomOpen && (
        <ImageLightbox
          media={displayedMedia}
          alt={alt}
          index={activeIndex}
          onIndexChange={selectIndex}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </div>
  );
}
