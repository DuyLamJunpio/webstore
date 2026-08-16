"use client";

import Image from "next/image";
import { useState } from "react";

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

      <div className="relative flex-1 overflow-hidden rounded-block bg-surface ring-1 ring-line">
        <div className="relative aspect-4/5">
          <Image
            key={images[active]}
            src={images[active]}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="rise object-cover"
          />
        </div>

        {badge && (
          <span className="eyebrow absolute left-4 top-4 rounded-full bg-gold px-3 py-1.5 text-[9px] leading-none text-cream">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
