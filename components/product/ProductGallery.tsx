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
              className={`relative aspect-square w-14 shrink-0 overflow-hidden rounded-card bg-surface transition-all sm:w-16 md:w-20 ${
                index === activeIndex
                  ? "ring-2 ring-ink scale-102 shadow-xs"
                  : "ring-1 ring-line hover:ring-ink/40 opacity-75 hover:opacity-100"
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
        className="group relative flex-1 overflow-hidden rounded-block bg-surface ring-1 ring-line shadow-xs"
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
              className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100"
            >
              <Search className="h-[18px] w-[18px]" />
            </span>
          </button>
        )}

        {badge && (
          <span className="eyebrow pointer-events-none absolute left-3.5 top-3.5 rounded-full bg-gold px-3 py-1 text-[9px] font-bold leading-none text-cream shadow-xs">
            {badge}
          </span>
        )}

        {/* ── Mobile Dot Indicators ── */}
        {displayedMedia.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 md:hidden pointer-events-none">
            {displayedMedia.map((item, index) => (
              <span
                key={`${item.type}:${item.src}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === activeIndex ? "w-6 bg-ink shadow-xs" : "w-1.5 bg-ink/30"
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
