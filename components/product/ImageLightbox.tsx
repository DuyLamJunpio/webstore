"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import MediaFrame, { PlayBadge } from "@/components/MediaFrame";
import { ChevronLeft, ChevronRight, Close } from "@/components/icons";
import type { Media } from "@/lib/data";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;
/** mức phóng khi bấm đúp — đủ nhìn đường may mà không mất phương hướng */
const QUICK_ZOOM = 2.5;
/** quãng vuốt ngang tối thiểu (px) để tính là lệnh chuyển ảnh */
const SWIPE_THRESHOLD = 56;
/** ngưỡng xê dịch còn được coi là "chạm" chứ không phải "kéo" */
const TAP_SLOP = 8;

type Point = { x: number; y: number };
type Size = { w: number; h: number };
/** trạng thái xem: hệ số phóng và độ lệch tính từ tâm khung */
type View = { zoom: number; x: number; y: number };

const RESET: View = { zoom: MIN_ZOOM, x: 0, y: 0 };

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** kích thước thật của ảnh sau khi object-contain co nó vào khung xem */
function containedSize(natural: Size | null, stage: Size): Size {
  if (!natural?.w || !natural.h || !stage.w || !stage.h) return stage;
  const ratio = Math.min(stage.w / natural.w, stage.h / natural.h);
  return { w: natural.w * ratio, h: natural.h * ratio };
}

export default function ImageLightbox({
  media,
  alt,
  index,
  onIndexChange,
  onClose,
}: {
  media: Media[];
  alt: string;
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<View>(RESET);
  const [dragging, setDragging] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const stageSize = useRef<Size>({ w: 0, h: 0 });
  const naturalSize = useRef<Size | null>(null);
  // nhiều ngón cùng chạm: phải giữ toạ độ từng ngón để tính thao tác chụm
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const drag = useRef<{ from: Point; offset: Point } | null>(null);
  const tap = useRef<Point | null>(null);

  const many = media.length > 1;
  const current = media[index];
  // Video có thanh điều khiển riêng: phóng to sẽ nuốt cú bấm play và kéo lệch cả
  // thanh tua, nên mọi thao tác phóng/kéo chỉ áp cho ô ảnh.
  const canZoom = current.type === "image";

  /**
   * Mọi đường đổi ảnh đều đi qua đây để mức phóng cũ được xoá ngay trong chính
   * thao tác của người dùng — reset trong useEffect sẽ tốn thêm một lượt render
   * và ảnh mới kịp loé lên ở khung nhìn đã bị cắt của ảnh trước.
   */
  const select = useCallback(
    (next: number) => {
      naturalSize.current = null;
      setView(RESET);
      onIndexChange(next);
    },
    [onIndexChange],
  );

  const go = useCallback(
    (step: number) => {
      if (!many) return;
      select((index + step + media.length) % media.length);
    },
    [media.length, index, many, select],
  );

  const clampView = useCallback((next: View): View => {
    if (next.zoom <= MIN_ZOOM) return RESET;
    const stage = stageSize.current;
    const rendered = containedSize(naturalSize.current, stage);
    const maxX = Math.max(0, (rendered.w * next.zoom - stage.w) / 2);
    const maxY = Math.max(0, (rendered.h * next.zoom - stage.h) / 2);
    return {
      zoom: next.zoom,
      x: clampNumber(next.x, -maxX, maxX),
      y: clampNumber(next.y, -maxY, maxY),
    };
  }, []);

  /**
   * Phóng quanh một điểm neo (con trỏ chuột hoặc tâm hai ngón) chứ không quanh
   * tâm khung: chỗ người dùng đang nhìn phải đứng yên, nếu không mỗi lần lăn
   * chuột là ảnh lại trượt đi và họ phải kéo tìm lại.
   */
  const applyZoom = useCallback(
    (resolve: (current: number) => number, anchor?: Point) => {
      setView((prev) => {
        const zoom = clampNumber(resolve(prev.zoom), MIN_ZOOM, MAX_ZOOM);
        if (zoom === prev.zoom) return prev;
        if (zoom <= MIN_ZOOM) return RESET;

        const rect = stageRef.current?.getBoundingClientRect();
        const ratio = zoom / prev.zoom;
        if (!rect || !anchor) {
          return clampView({ zoom, x: prev.x * ratio, y: prev.y * ratio });
        }

        const px = anchor.x - rect.left - rect.width / 2;
        const py = anchor.y - rect.top - rect.height / 2;
        return clampView({
          zoom,
          x: px - ratio * (px - prev.x),
          y: py - ratio * (py - prev.y),
        });
      });
    },
    [clampView],
  );

  /** điểm chạm có rơi vào vùng ảnh không — chạm ra ngoài thì đóng khung xem */
  const hitsImage = (point: Point) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return true;
    const rendered = containedSize(naturalSize.current, stageSize.current);
    const centreX = rect.left + rect.width / 2 + view.x;
    const centreY = rect.top + rect.height / 2 + view.y;
    return (
      Math.abs(point.x - centreX) <= (rendered.w * view.zoom) / 2 &&
      Math.abs(point.y - centreY) <= (rendered.h * view.zoom) / 2
    );
  };

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      stageSize.current = { w: rect.width, h: rect.height };
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft") go(-1);
      else if (event.key === "ArrowRight") go(1);
      else if (canZoom && (event.key === "+" || event.key === "=")) applyZoom((z) => z + ZOOM_STEP);
      else if (canZoom && event.key === "-") applyZoom((z) => z - ZOOM_STEP);
      else if (event.key === "0") setView(RESET);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [applyZoom, canZoom, go, onClose]);

  // React gắn onWheel ở chế độ passive nên preventDefault không có tác dụng —
  // phải tự đăng ký listener với passive: false trên chính khung xem.
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (!canZoom) return;
      event.preventDefault();
      applyZoom((z) => z * Math.pow(1.0015, -event.deltaY), {
        x: event.clientX,
        y: event.clientY,
      });
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [applyZoom, canZoom]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canZoom) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: view.zoom };
      drag.current = null;
      tap.current = null;
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    tap.current = point;
    if (view.zoom > MIN_ZOOM) {
      drag.current = { from: point, offset: { x: view.x, y: view.y } };
      setDragging(true);
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canZoom || !pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const start = pinch.current;
      applyZoom(() => (start.zoom * dist) / start.dist, {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
      });
      return;
    }

    if (!drag.current) return;
    const { from, offset } = drag.current;
    setView((prev) =>
      clampView({
        zoom: prev.zoom,
        x: offset.x + (event.clientX - from.x),
        y: offset.y + (event.clientY - from.y),
      }),
    );
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canZoom) return;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const wasDragging = drag.current !== null;
    drag.current = null;
    setDragging(false);

    const start = tap.current;
    tap.current = null;
    if (!start || wasDragging) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? 1 : -1);
      return;
    }
    if (Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP) {
      if (!hitsImage({ x: event.clientX, y: event.clientY })) onClose();
    }
  };

  const onDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canZoom) return;
    applyZoom((z) => (z > MIN_ZOOM ? MIN_ZOOM : QUICK_ZOOM), {
      x: event.clientX,
      y: event.clientY,
    });
  };

  const zoomed = view.zoom > MIN_ZOOM;
  const controlClass =
    "grid h-10 w-10 place-items-center rounded-full text-cream transition-colors hover:bg-cream/15 disabled:cursor-not-allowed disabled:opacity-35";

  /**
   * Bắt buộc phải treo thẳng vào body. Khung ảnh ở trang chi tiết nằm trong một
   * thẻ `position: sticky` — thẻ đó tự mở một ngữ cảnh xếp lớp riêng, nên dù có
   * để z-index bao nhiêu thì lớp phủ vẫn bị thanh điều hướng và nút liên hệ nổi
   * đè lên.
   */
  return createPortal(
    <div
      className="fixed inset-0 z-80 flex flex-col bg-ink/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Xem ảnh — ${alt}`}
    >
      <header className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="truncate text-[13px] tabular-nums text-cream/70">
          {many ? `${index + 1} / ${media.length}` : alt}
        </p>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => applyZoom((z) => z - ZOOM_STEP)}
            disabled={view.zoom <= MIN_ZOOM}
            aria-label="Thu nhỏ"
            className={controlClass}
          >
            <span aria-hidden className="text-lg leading-none">
              −
            </span>
          </button>
          <button
            type="button"
            onClick={() => setView(RESET)}
            aria-label="Về kích thước gốc"
            className="min-w-14 rounded-full px-2 py-1.5 text-[13px] tabular-nums text-cream/70 transition-colors hover:bg-cream/15 hover:text-cream"
          >
            {Math.round(view.zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => applyZoom((z) => z + ZOOM_STEP)}
            disabled={view.zoom >= MAX_ZOOM}
            aria-label="Phóng to"
            className={controlClass}
          >
            <span aria-hidden className="text-lg leading-none">
              +
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng khung xem ảnh"
            autoFocus
            className={`${controlClass} ml-1`}
          >
            <Close />
          </button>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        <div
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={onDoubleClick}
          className={`absolute inset-0 select-none ${canZoom ? "touch-none" : ""} ${
            !canZoom
              ? ""
              : zoomed
                ? dragging
                  ? "cursor-grabbing"
                  : "cursor-grab"
                : "cursor-zoom-in"
          }`}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom})`,
              transition: dragging ? "none" : "transform 200ms ease-out",
            }}
          >
            {current.type === "video" ? (
              <video
                key={current.src}
                src={current.src}
                controls
                autoPlay
                playsInline
                preload="metadata"
                aria-label={`Video sản phẩm — ${alt}`}
                className="absolute inset-0 h-full w-full object-contain"
              />
            ) : (
              <Image
                key={current.src}
                src={current.src}
                alt={alt}
                fill
                sizes="100vw"
                quality={90}
                draggable={false}
                onLoad={(event) => {
                  const img = event.currentTarget;
                  naturalSize.current = { w: img.naturalWidth, h: img.naturalHeight };
                }}
                className="object-contain"
              />
            )}
          </div>
        </div>

        {many && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Ảnh trước"
              className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-cream/10 text-cream backdrop-blur transition-colors hover:bg-cream/25 sm:left-6"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Ảnh kế tiếp"
              className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-cream/10 text-cream backdrop-blur transition-colors hover:bg-cream/25 sm:right-6"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {many && (
        <div className="flex shrink-0 justify-center gap-2 overflow-x-auto px-4 pt-4">
          {media.map((item, position) => (
            <button
              key={item.src}
              type="button"
              onClick={() => select(position)}
              aria-label={`${item.type === "video" ? "Xem video" : "Xem ảnh"} ${position + 1}`}
              aria-current={position === index}
              className={`relative aspect-square w-14 shrink-0 overflow-hidden rounded-card bg-ink-soft transition-all ${
                position === index ? "ring-2 ring-cream" : "opacity-55 hover:opacity-100"
              }`}
            >
              <MediaFrame media={item} alt="" sizes="56px" />
              {item.type === "video" && <PlayBadge className="absolute inset-0 m-auto h-6 w-6" />}
            </button>
          ))}
        </div>
      )}

      <p className="shrink-0 px-4 py-4 text-center text-[12px] text-cream/45">
        Lăn chuột hoặc chụm hai ngón để phóng · bấm đúp để phóng nhanh
        {many ? " · vuốt ngang hoặc dùng phím ← → để đổi ảnh" : ""}
      </p>
    </div>,
    document.body,
  );
}
