"use client";

import Image from "next/image";
import { useState } from "react";
import { Search } from "@/components/icons";
import ImageLightbox from "./ImageLightbox";

export default function ProductGallery({
  images,
  alt,
  badge,
}: {
  images: string[];
  alt: string;
  badge?: string;
}) {
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {images.length > 1 && (
        <div className="flex gap-3 md:flex-col" role="tablist" aria-label="Ảnh sản phẩm">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Xem ảnh ${index + 1}`}
              onClick={() => setActive(index)}
              className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-card bg-surface transition-all md:w-20 ${
                index === active ? "ring-2 ring-ink" : "ring-1 ring-line hover:ring-ink/40"
              }`}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="group relative flex-1 overflow-hidden rounded-block bg-surface ring-1 ring-line">
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label={`Phóng to ảnh — ${alt}`}
          className="block w-full cursor-zoom-in"
        >
          <span className="relative block aspect-4/5">
            <Image
              key={images[active]}
              src={images[active]}
              alt={alt}
              fill
              priority
              sizes="(max-width: 767px) 100vw, 480px"
              className="rise object-cover"
            />
          </span>

          <span
            aria-hidden
            className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-cream/90 text-ink shadow-sm backdrop-blur transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100"
          >
            <Search className="h-[18px] w-[18px]" />
          </span>
        </button>

        {badge && (
          <span className="eyebrow pointer-events-none absolute left-4 top-4 rounded-full bg-gold px-3 py-1.5 text-[9px] leading-none text-cream">
            {badge}
          </span>
        )}
      </div>

      {zoomOpen && (
        <ImageLightbox
          images={images}
          alt={alt}
          index={active}
          onIndexChange={setActive}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </div>
  );
}
