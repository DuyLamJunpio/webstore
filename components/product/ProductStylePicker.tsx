"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import type { ProductStyle } from "@/lib/data";

export default function ProductStylePicker({
  styles,
  selected,
  onSelect,
  isSoldOut,
  className = "",
}: {
  styles: ProductStyle[];
  selected: ProductStyle;
  onSelect: (id: string) => void;
  isSoldOut: (id: string) => boolean;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const canLeft = el.scrollLeft > 2;
    const canRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 2;
    setCanScrollLeft(canLeft);
    setCanScrollRight(canRight);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();

    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState, styles.length]);

  // Cuộn đến mẫu đang chọn nếu nằm ngoài vùng hiển thị
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeBtn = el.querySelector<HTMLElement>(`[data-style-id="${selected.id}"]`);
    if (activeBtn) {
      const btnLeft = activeBtn.offsetLeft;
      const btnRight = btnLeft + activeBtn.offsetWidth;
      const scrollLeft = el.scrollLeft;
      const clientWidth = el.clientWidth;

      if (btnLeft < scrollLeft) {
        el.scrollTo({ left: btnLeft - 12, behavior: "smooth" });
      } else if (btnRight > scrollLeft + clientWidth) {
        el.scrollTo({ left: btnRight - clientWidth + 12, behavior: "smooth" });
      }
    }
  }, [selected.id]);

  // Đảm bảo nhả chuột toàn cục nếu kéo ra khỏi khung
  useEffect(() => {
    const onGlobalPointerUp = () => {
      if (isPointerDownRef.current) {
        isPointerDownRef.current = false;
        setTimeout(() => {
          setIsDragging(false);
          hasMovedRef.current = false;
        }, 50);
      }
    };
    window.addEventListener("pointerup", onGlobalPointerUp);
    return () => window.removeEventListener("pointerup", onGlobalPointerUp);
  }, []);

  const scrollByDirection = (direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = Math.max(el.clientWidth * 0.7, 200);
    el.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" || e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;

    isPointerDownRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.clientX;
    startScrollLeftRef.current = el.scrollLeft;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || e.pointerType === "touch") return;
    const el = scrollRef.current;
    if (!el) return;

    const deltaX = e.clientX - startXRef.current;
    if (Math.abs(deltaX) > 4) {
      if (!hasMovedRef.current) {
        hasMovedRef.current = true;
        setIsDragging(true);
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
      el.scrollLeft = startScrollLeftRef.current - deltaX;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    isPointerDownRef.current = false;

    if (hasMovedRef.current) {
      try {
        scrollRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setTimeout(() => {
        setIsDragging(false);
        hasMovedRef.current = false;
      }, 50);
    } else {
      setIsDragging(false);
      hasMovedRef.current = false;
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    isPointerDownRef.current = false;
    setIsDragging(false);
    hasMovedRef.current = false;
  };

  // Catalogue cũ được cấp một mẫu tương thích; không để chi tiết kỹ thuật đó
  // làm giao diện hàng cũ tự nhiên mọc thêm một lựa chọn vô nghĩa.
  if (styles.length <= 1) return null;

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <p className="eyebrow text-ink/70">
          Mẫu: <span className="font-semibold text-ink">{selected.name}</span>
        </p>

        {(canScrollLeft || canScrollRight) && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollByDirection(-1)}
              disabled={!canScrollLeft}
              aria-label="Xem mẫu trước"
              className={`grid h-7 w-7 place-items-center rounded-full border transition-all ${
                canScrollLeft
                  ? "border-line-strong bg-surface text-ink hover:bg-black hover:text-white hover:border-black shadow-2xs cursor-pointer"
                  : "border-line/40 text-muted/30 cursor-not-allowed bg-transparent"
              }`}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollByDirection(1)}
              disabled={!canScrollRight}
              aria-label="Xem mẫu tiếp theo"
              className={`grid h-7 w-7 place-items-center rounded-full border transition-all ${
                canScrollRight
                  ? "border-line-strong bg-surface text-ink hover:bg-black hover:text-white hover:border-black shadow-2xs cursor-pointer"
                  : "border-line/40 text-muted/30 cursor-not-allowed bg-transparent"
              }`}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="relative mt-3 group">
        {/* Floating Left Button */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-1 z-10 flex items-center pr-3 pl-0 bg-gradient-to-r from-surface via-surface/85 to-transparent pointer-events-none">
            <button
              type="button"
              onClick={() => scrollByDirection(-1)}
              aria-label="Xem mẫu trước"
              className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full border border-line-strong bg-surface text-ink shadow-md transition-all hover:scale-105 hover:bg-black hover:text-white hover:border-black cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        <div
          ref={scrollRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className={`flex gap-3 overflow-x-auto pb-1 scrollbar-none select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{ touchAction: "pan-x pan-y" }}
        >
          {styles.map((option) => {
            const soldOut = isSoldOut(option.id);
            const active = selected.id === option.id;

            return (
              <button
                key={option.id}
                type="button"
                data-style-id={option.id}
                onClick={(e) => {
                  if (hasMovedRef.current || isDragging) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  onSelect(option.id);
                }}
                aria-pressed={active}
                aria-label={`${option.name}${soldOut ? " — hết hàng" : ""}`}
                title={option.name}
                className={`w-24 shrink-0 rounded-card border bg-surface p-1.5 text-left transition-all select-none ${
                  active
                    ? "border-ink shadow-sm ring-1 ring-ink"
                    : "border-line-strong hover:border-ink"
                }`}
              >
                <span className="relative block aspect-square overflow-hidden rounded-[10px] bg-cream-dark pointer-events-none select-none">
                  <Image
                    src={option.image}
                    alt={`Mẫu ${option.name}`}
                    fill
                    sizes="96px"
                    draggable={false}
                    className={`object-cover transition-transform duration-300 pointer-events-none select-none ${
                      active ? "scale-105" : "hover:scale-105"
                    } ${soldOut ? "opacity-45 grayscale" : ""}`}
                  />
                  {soldOut && (
                    <span className="absolute inset-0 grid place-items-center" aria-hidden>
                      <span className="h-px w-[120%] rotate-45 bg-ink/60" />
                    </span>
                  )}
                </span>
                <span className={`mt-1.5 block truncate px-0.5 text-xs font-semibold pointer-events-none select-none ${
                  active ? "text-ink" : "text-muted"
                }`}>
                  {option.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Floating Right Button */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-1 z-10 flex items-center pl-3 pr-0 bg-gradient-to-l from-surface via-surface/85 to-transparent pointer-events-none">
            <button
              type="button"
              onClick={() => scrollByDirection(1)}
              aria-label="Xem mẫu tiếp theo"
              className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full border border-line-strong bg-surface text-ink shadow-md transition-all hover:scale-105 hover:bg-black hover:text-white hover:border-black cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
