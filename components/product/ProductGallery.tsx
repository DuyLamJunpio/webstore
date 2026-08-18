"use client";

import { useState } from "react";
import MediaFrame, { PlayBadge } from "@/components/MediaFrame";
import { Search } from "@/components/icons";
import type { Media } from "@/lib/data";
import ImageLightbox from "./ImageLightbox";

export default function ProductGallery({
  media,
  alt,
  badge,
}: {
  media: Media[];
  alt: string;
  badge?: string;
}) {
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const current = media[active];
  const isVideo = current?.type === "video";

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {media.length > 1 && (
        <div className="flex gap-3 md:flex-col" role="tablist" aria-label="Ảnh sản phẩm">
          {media.map((item, index) => (
            <button
              key={item.src}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`${item.type === "video" ? "Xem video" : "Xem ảnh"} ${index + 1}`}
              onClick={() => setActive(index)}
              className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-card bg-surface transition-all md:w-20 ${
                index === active ? "ring-2 ring-ink" : "ring-1 ring-line hover:ring-ink/40"
              }`}
            >
              <MediaFrame media={item} alt="" sizes="80px" />
              {item.type === "video" && <PlayBadge className="absolute inset-0 m-auto h-7 w-7" />}
            </button>
          ))}
        </div>
      )}

      <div className="group relative flex-1 overflow-hidden rounded-block bg-surface ring-1 ring-line">
        {/*
          Video phát ngay tại chỗ bằng thanh điều khiển sẵn có của trình duyệt.
          Không bọc trong nút mở khung phóng to như ảnh: nút bao ngoài sẽ nuốt cú
          bấm vào nút play, thành ra định xem video thì lại mở hộp thoại.
        */}
        {isVideo ? (
          <div className="relative aspect-4/5">
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
            <span className="relative block aspect-4/5">
              <MediaFrame
                key={current.src}
                media={current}
                alt={alt}
                priority
                sizes="(max-width: 767px) 100vw, 480px"
                className="rise"
              />
            </span>

            <span
              aria-hidden
              className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-cream/90 text-ink shadow-sm backdrop-blur transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100"
            >
              <Search className="h-[18px] w-[18px]" />
            </span>
          </button>
        )}

        {badge && (
          <span className="eyebrow pointer-events-none absolute left-4 top-4 rounded-full bg-gold px-3 py-1.5 text-[9px] leading-none text-cream">
            {badge}
          </span>
        )}
      </div>

      {zoomOpen && (
        <ImageLightbox
          media={media}
          alt={alt}
          index={active}
          onIndexChange={setActive}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </div>
  );
}
