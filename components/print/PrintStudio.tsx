"use client";

/**
 * Studio đặt in — nơi khách dựng chiếc áo của mình.
 *
 * Hai hệ toạ độ chạy song song và không được lẫn:
 *
 *   • mm  — sự thật, lưu trong `Placement`, là thứ thợ in đọc
 *   • %   — chỉ để vẽ lên ảnh mockup, suy ra từ mm mỗi lần render
 *
 * Giá hiện ở đây do `lib/print.ts` tính cho mượt tay. Nó là BẢN SAO của bộ máy
 * bên trang quản trị; con số tính tiền thật được dựng lại ở máy chủ lúc chốt
 * thiết kế, nên một trình duyệt bị sửa cũng không mua rẻ hơn được đồng nào.
 */

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { formatPrice } from "@/lib/data";
import { addPrintDraft } from "@/lib/print-draft";
import {
  boundingBox,
  dpiAt,
  pickTier,
  quote,
  type DesignState,
  type Placement,
  type PrintAsset,
  type PrintBlank,
  type PrintCatalogue,
} from "@/lib/print";

type Props = { catalogue: PrintCatalogue; blank: PrintBlank };

/** Hình mới thả vào chiếm ngần này bề rộng vùng in — đủ thấy, chưa chạm mép. */
const DROP_WIDTH_RATIO = 0.45;

/** Khung chữ mặc định: cao bằng ngần này bề rộng, xấp xỉ một dòng chữ. */
const TEXT_BOX_RATIO = 0.24;

let seq = 0;
const nextKey = () => `p${++seq}`;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const round1 = (n: number) => Math.round(n * 10) / 10;

export default function PrintStudio({ catalogue, blank }: Props) {
  /** Chỉ kỹ thuật vừa được phôi này nhận, vừa đã có giá trong ma trận. */
  const techniques = useMemo(
    () =>
      catalogue.techniques.filter(
        (t) =>
          blank.technique_ids.includes(t.id) &&
          Object.keys(catalogue.cells[String(t.id)] ?? {}).length > 0,
      ),
    [catalogue, blank],
  );

  const [design, setDesign] = useState<DesignState>(() => ({
    blankId: blank.id,
    colorName: blank.colors[0]?.name ?? "",
    size: blank.sizes[Math.min(1, blank.sizes.length - 1)] ?? blank.sizes[0] ?? "Một cỡ",
    techniqueId: techniques[0]?.id ?? 0,
    inkColors: 1,
    qty: Math.max(1, blank.moq),
    placements: [],
  }));

  const [zoneKey, setZoneKey] = useState(blank.zones[0]?.key ?? "");
  const [selected, setSelected] = useState<string | null>(null);
  const [uploads, setUploads] = useState<PrintAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState<{ code: string; total: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);

  const assets = useMemo(() => {
    const map = new Map<number, PrintAsset>();
    for (const a of [...catalogue.library, ...uploads]) map.set(a.id, a);
    return map;
  }, [catalogue.library, uploads]);

  const technique = techniques.find((t) => t.id === design.techniqueId);
  const color = blank.colors.find((c) => c.name === design.colorName) ?? blank.colors[0];
  const zone = blank.zones.find((z) => z.key === zoneKey) ?? blank.zones[0];

  const result = useMemo(() => quote(design, blank, catalogue, assets), [design, blank, catalogue, assets]);

  /**
   * Tấm mockup đang hiện: ưu tiên đúng màu và đúng góc của vùng đang chọn, rồi
   * lùi dần. Thiếu tấm nào cũng vẫn dựng được màn hình thay vì trắng trơn.
   */
  const mockup = useMemo(() => {
    const byColor = blank.mockups.filter((m) => m.color_id === color?.id);

    return (
      byColor.find((m) => m.view === zoneKey) ??
      byColor.find((m) => m.view === "front") ??
      byColor[0] ??
      blank.mockups[0] ??
      null
    );
  }, [blank.mockups, color?.id, zoneKey]);

  // ── Đổi thiết kế ───────────────────────────────────────────────────
  const patch = useCallback((next: Partial<DesignState>) => {
    setDesign((d) => ({ ...d, ...next }));
  }, []);

  const addPlacement = useCallback(
    (assetId: number) => {
      if (!zone) return;
      const asset = assets.get(assetId);
      if (!asset) return;

      const wMm = Math.min(zone.width_mm * DROP_WIDTH_RATIO, asset.max_width_mm);
      const ratio = asset.height_px && asset.width_px ? asset.height_px / asset.width_px : 1;
      const hMm = wMm * ratio;

      const placement: Placement = {
        key: nextKey(),
        zone: zone.key,
        kind: "image",
        assetId,
        xMm: (zone.width_mm - wMm) / 2,
        yMm: (zone.height_mm - hMm) / 2,
        wMm,
        hMm,
        rotation: 0,
      };

      setDesign((d) => ({ ...d, placements: [...d.placements, placement] }));
      setSelected(placement.key);
    },
    [assets, zone],
  );

  /**
   * Thả một dòng chữ vào vùng đang chọn.
   *
   * Chữ là vector nên không có DPI để cảnh báo — nó nét ở mọi kích thước. Khách
   * chỉnh khung, xưởng dàn chữ cho vừa khung đó.
   */
  const addText = useCallback(() => {
    if (!zone || !catalogue.fonts.length) return;

    const wMm = zone.width_mm * 0.7;
    const placement: Placement = {
      key: nextKey(),
      zone: zone.key,
      kind: "text",
      assetId: null,
      text: { content: "Chữ của bạn", fontId: catalogue.fonts[0].id, color: "#1a1614" },
      xMm: (zone.width_mm - wMm) / 2,
      yMm: (zone.height_mm - wMm * TEXT_BOX_RATIO) / 2,
      wMm,
      hMm: wMm * TEXT_BOX_RATIO,
      rotation: 0,
    };

    setDesign((d) => ({ ...d, placements: [...d.placements, placement] }));
    setSelected(placement.key);
  }, [catalogue.fonts, zone]);

  const updatePlacement = useCallback((key: string, next: Partial<Placement>) => {
    setDesign((d) => ({
      ...d,
      placements: d.placements.map((p) => (p.key === key ? { ...p, ...next } : p)),
    }));
  }, []);

  const removePlacement = useCallback((key: string) => {
    setDesign((d) => ({ ...d, placements: d.placements.filter((p) => p.key !== key) }));
    setSelected(null);
  }, []);

  // ── Kéo và phóng to ────────────────────────────────────────────────
  const drag = useRef<{
    mode: "move" | "resize";
    key: string;
    startX: number;
    startY: number;
    x0: number;
    y0: number;
    w0: number;
    h0: number;
    pxPerMmX: number;
    pxPerMmY: number;
  } | null>(null);

  const zoneScale = useCallback(() => {
    const el = stageRef.current;
    if (!el || !zone) return { pxPerMmX: 1, pxPerMmY: 1 };

    return {
      pxPerMmX: ((zone.box.w / 100) * el.clientWidth) / zone.width_mm,
      pxPerMmY: ((zone.box.h / 100) * el.clientHeight) / zone.height_mm,
    };
  }, [zone]);

  const onPointerDown = (event: React.PointerEvent, key: string, mode: "move" | "resize") => {
    const placement = design.placements.find((p) => p.key === key);
    if (!placement) return;

    event.preventDefault();
    event.stopPropagation();
    (event.target as Element).setPointerCapture(event.pointerId);
    setSelected(key);

    drag.current = {
      mode,
      key,
      startX: event.clientX,
      startY: event.clientY,
      x0: placement.xMm,
      y0: placement.yMm,
      w0: placement.wMm,
      h0: placement.hMm,
      ...zoneScale(),
    };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !zone) return;

    if (d.mode === "move") {
      const dx = (event.clientX - d.startX) / d.pxPerMmX;
      const dy = (event.clientY - d.startY) / d.pxPerMmY;

      // Cho phép nhô ra một phần tư ngoài khung: khách hay muốn hình tràn mép,
      // và chặn cứng ở biên làm thao tác kéo thành giật cục.
      updatePlacement(d.key, {
        xMm: clamp(d.x0 + dx, -d.w0 * 0.25, zone.width_mm - d.w0 * 0.75),
        yMm: clamp(d.y0 + dy, -d.h0 * 0.25, zone.height_mm - d.h0 * 0.75),
      });
      return;
    }

    const asset = assets.get(design.placements.find((p) => p.key === d.key)?.assetId ?? -1) ?? undefined;
    const dx = (event.clientX - d.startX) / d.pxPerMmX;
    const maxMm = Math.min(zone.width_mm, asset?.max_width_mm ?? 9999);
    const minMm = Math.max(8, asset?.min_width_mm ?? 8);
    const wMm = clamp(d.w0 + dx, minMm, maxMm);

    updatePlacement(d.key, { wMm, hMm: wMm * (d.h0 / d.w0) });
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  // ── Tải file lên ───────────────────────────────────────────────────
  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBusy(true);
    setNotice(null);
    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch("/api/print/assets", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Không tải được file lên.");

      const asset = data as PrintAsset;
      setUploads((u) => [...u, asset]);
      addPlacement(asset.id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không tải được file lên.");
    }
    setBusy(false);
  };

  // ── Chốt thiết kế ──────────────────────────────────────────────────
  const onSubmit = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/print/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blank_id: design.blankId,
          technique_id: design.techniqueId,
          color_name: design.colorName,
          size: design.size,
          ink_colors: design.inkColors,
          qty: design.qty,
          placements: design.placements.map((p) => ({
            zone: p.zone,
            kind: p.kind,
            asset_id: p.assetId,
            text_content: p.text?.content ?? null,
            text_font_id: p.text?.fontId ?? null,
            text_color: p.text?.color ?? null,
            x_mm: p.xMm,
            y_mm: p.yMm,
            w_mm: p.wMm,
            h_mm: p.hMm,
            rotation: p.rotation,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Không lưu được thiết kế.");

      /*
       * Cất mẫu vừa chốt rồi đưa thẳng sang trang thanh toán. Dừng lại ở một
       * màn hình "đây là mã của bạn" nghe thì lịch sự, nhưng đó là chỗ khách
       * rời đi nhiều nhất — họ vừa thiết kế xong và đang muốn trả tiền.
       */
      addPrintDraft({
        code: data.code,
        label: `${blank.name} · ${design.colorName} · size ${design.size}`,
        qty: design.qty,
        unitPrice: data.unit_price,
        total: data.total_price,
        thumbUrl: assets.get(design.placements[0]?.assetId ?? -1)?.url ?? null,
        leadDays: Math.max(blank.lead_days, technique?.lead_days ?? 0),
      });

      setSubmitted({ code: data.code, total: data.total_price });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không lưu được thiết kế.");
    }
    setBusy(false);
  };

  const zonePlacements = design.placements.filter((p) => p.zone === zoneKey);
  const bbox = zonePlacements.length ? boundingBox(zonePlacements) : null;
  const tier = bbox ? pickTier(bbox, catalogue.tiers) : null;
  const selectedPlacement = design.placements.find((p) => p.key === selected);
  const canSubmit = design.placements.length > 0 && result.errors.length === 0 && !busy;

  // ── Đặt xong ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <main className="shell py-20 text-center">
        <p className="eyebrow text-gold-deep">Đã thêm vào giỏ hàng</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-ink">Mẫu áo của bạn</h1>
        <p className="mt-5 font-mono text-2xl font-bold tracking-wider text-ink">{submitted.code}</p>
        <p className="measure mt-5 text-muted">
          Tổng cộng <strong className="text-ink">{formatPrice(submitted.total)}</strong> cho {design.qty} áo.
          Cần thêm size hoặc màu khác thì <strong className="text-ink">thiết kế thêm một mẫu nữa</strong> —
          các mẫu cùng nằm trong một đơn, y như mua nhiều món.
        </p>
        <p className="measure mt-3 text-muted">
          Shop <strong className="text-ink">duyệt file thiết kế</strong> trước khi in. File chưa đủ nét hoặc
          không in được thì shop báo lại và hoàn tiền đầy đủ.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/checkout"
            className="rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-gold-deep"
          >
            Xem giỏ và thanh toán
          </Link>
          <Link
            href="/in-ao"
            className="rounded-full border border-line-strong px-6 py-3.5 text-sm font-semibold text-ink"
          >
            Thiết kế thêm mẫu
          </Link>
        </div>

        <p className="measure mt-6 text-xs text-muted">
          Các mẫu đã thêm được giữ lại — bạn rời trang rồi quay lại vẫn thấy chúng ở bước thanh toán.
          Chưa trả tiền thì chưa có gì được in.
        </p>
      </main>
    );
  }

  /*
   * Nạp tệp phông của shop.
   *
   * Tên mặt chữ dựng TỪ ID chứ không lấy chuỗi `family` từ máy chủ: nó đi thẳng
   * vào một thẻ style, nên phải là thứ không ai chèn được gì vào. Trang quản trị
   * đặt `family` thành `"print-font-{id}"` đúng theo khuôn này lúc tải tệp lên.
   */
  const fontFaces = catalogue.fonts
    .filter((f) => f.url && /^https?:\/\//.test(f.url))
    .map((f) => `@font-face{font-family:"print-font-${f.id}";src:url("${encodeURI(f.url!)}");font-display:swap;}`)
    .join("");

  return (
    <main className="shell py-8 sm:py-12">
      {fontFaces && <style>{fontFaces}</style>}

      <nav className="mb-5 text-sm text-muted">
        <Link href="/in-ao" className="hover:text-ink">In áo theo yêu cầu</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-ink">{blank.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_340px] gap-6 items-start">
        {/* ── Lựa chọn ── */}
        <div className="space-y-6">
          <section>
            <p className="eyebrow text-ink/70">
              Màu áo: <span className="font-semibold text-ink">{color?.name}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {blank.colors.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => patch({ colorName: option.name })}
                  aria-pressed={option.name === design.colorName}
                  aria-label={option.name}
                  title={`${option.name} — tông ${option.tone === "dark" ? "tối" : "sáng"}`}
                  className={`h-9 w-9 rounded-full transition-all ${
                    option.name === design.colorName
                      ? "ring-2 ring-ink ring-offset-2 ring-offset-cream"
                      : "ring-1 ring-line-strong hover:ring-ink"
                  }`}
                  style={{ backgroundColor: option.hex }}
                />
              ))}
            </div>
          </section>

          <section>
            <p className="eyebrow text-ink/70">Kích cỡ</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {blank.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => patch({ size })}
                  aria-pressed={size === design.size}
                  className={`h-10 min-w-[52px] rounded-full border px-3.5 text-sm font-semibold transition-all ${
                    size === design.size
                      ? "border-ink bg-ink text-cream"
                      : "border-line-strong bg-surface text-ink/80 hover:border-ink"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="eyebrow text-ink/70">Kỹ thuật in</p>
            <div className="mt-3 space-y-2">
              {techniques.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    patch({
                      techniqueId: option.id,
                      inkColors: Math.min(design.inkColors, option.max_colors ?? 99),
                    })
                  }
                  aria-pressed={option.id === design.techniqueId}
                  className={`w-full rounded-card border px-3.5 py-2.5 text-left transition-all ${
                    option.id === design.techniqueId
                      ? "border-ink bg-cream-dark/60"
                      : "border-line bg-surface hover:border-line-strong"
                  }`}
                >
                  <span className="block text-sm font-semibold text-ink">{option.name}</span>
                  <span className="mt-0.5 block text-[11px] text-muted">
                    {option.max_colors === null ? "không giới hạn màu" : `tối đa ${option.max_colors} màu`}
                    {" · "}từ {option.moq} áo · {option.lead_days} ngày
                  </span>
                </button>
              ))}
            </div>

            {/* Ràng buộc đọc từ dữ liệu của kỹ thuật, không gõ cứng theo tên. */}
            {technique && (
              <ul className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
                <Chip>DPI ≥ {technique.min_dpi}</Chip>
                <Chip ok={technique.accepts_photo}>ảnh chụp {technique.accepts_photo ? "✓" : "✕"}</Chip>
                <Chip ok={technique.accepts_gradient}>chuyển màu {technique.accepts_gradient ? "✓" : "✕"}</Chip>
                <Chip>{technique.file_types.join(", ").toUpperCase()}</Chip>
              </ul>
            )}

            {technique?.max_colors != null && (
              <label className="mt-3 block">
                <span className="text-xs font-semibold text-muted">Số màu mực</span>
                <input
                  type="number"
                  min={1}
                  max={technique.max_colors}
                  value={design.inkColors}
                  onChange={(e) => patch({ inkColors: Math.max(1, Number(e.target.value) || 1) })}
                  className="mt-1 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm tabular-nums"
                />
              </label>
            )}
          </section>
        </div>

        {/* ── Khung áo ── */}
        <div>
          <div className="mb-3 flex flex-wrap justify-center gap-2">
            {blank.zones.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setZoneKey(option.key);
                  setSelected(null);
                }}
                aria-pressed={option.key === zoneKey}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
                  option.key === zoneKey
                    ? "border-ink bg-ink text-cream"
                    : "border-line-strong bg-surface text-ink/80 hover:border-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div
            ref={stageRef}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onPointerDown={() => setSelected(null)}
            className="relative mx-auto w-full max-w-[440px] touch-none select-none overflow-hidden rounded-block border border-line bg-cream-dark/30"
            style={{ aspectRatio: mockup?.height_px ? `${mockup.width_px}/${mockup.height_px}` : "4/5" }}
          >
            {mockup ? (
              <Image
                src={mockup.url}
                alt={blank.name}
                fill
                sizes="440px"
                className="pointer-events-none object-contain"
                priority
              />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-sm text-muted">
                Chưa có ảnh mockup
              </span>
            )}

            {blank.zones.map((option) => {
              const active = option.key === zoneKey;

              return (
                <div
                  key={option.key}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (!active) {
                      setZoneKey(option.key);
                      setSelected(null);
                    }
                  }}
                  className={`absolute rounded-sm transition-colors ${
                    active
                      ? "border border-gold"
                      : "cursor-pointer border border-dashed border-line-strong hover:border-gold"
                  }`}
                  style={{
                    left: `${option.box.x}%`,
                    top: `${option.box.y}%`,
                    width: `${option.box.w}%`,
                    height: `${option.box.h}%`,
                  }}
                >
                  {active &&
                    design.placements
                      .filter((p) => p.zone === option.key)
                      .map((p) => {
                        const asset = p.assetId === null ? undefined : assets.get(p.assetId);
                        const dpi = dpiAt(asset, p.wMm);
                        // Chữ là vector: không có độ phân giải để mà thiếu.
                        const low = p.kind === "image" && technique ? dpi < technique.min_dpi : false;
                        const font = catalogue.fonts.find((f) => f.id === p.text?.fontId);

                        return (
                          <div
                            key={p.key}
                            onPointerDown={(e) => onPointerDown(e, p.key, "move")}
                            className={`absolute cursor-grab ${
                              selected === p.key ? "outline outline-2 outline-gold outline-offset-1" : ""
                            }`}
                            style={{
                              left: `${(p.xMm / option.width_mm) * 100}%`,
                              top: `${(p.yMm / option.height_mm) * 100}%`,
                              width: `${(p.wMm / option.width_mm) * 100}%`,
                              height: `${(p.hMm / option.height_mm) * 100}%`,
                              transform: `rotate(${p.rotation}deg)`,
                            }}
                          >
                            {p.kind === "text" ? (
                              /*
                               * Vẽ chữ bằng SVG chứ không bằng thẻ chữ thường: SVG
                               * co giãn chữ vừa khít khung theo đúng tỉ lệ, không
                               * phải đoán cỡ chữ theo pixel. Đây cũng chính là cách
                               * file giao cho xưởng được dựng, nên cái khách thấy
                               * và cái thợ in ra là một.
                               */
                              <svg
                                viewBox="0 0 200 60"
                                preserveAspectRatio="xMidYMid meet"
                                className="pointer-events-none h-full w-full"
                              >
                                <text
                                  x="100"
                                  y="30"
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  fontFamily={font?.family ?? "sans-serif"}
                                  fontSize="44"
                                  fill={p.text?.color ?? "#1a1614"}
                                >
                                  {p.text?.content}
                                </text>
                              </svg>
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={asset?.url ?? ""}
                                alt={asset?.name ?? ""}
                                className="pointer-events-none h-full w-full object-contain"
                              />
                            )}

                            {low && (
                              <span className="absolute -left-1 -top-2 rounded-full bg-[#a8452f] px-1.5 text-[9px] font-bold text-white">
                                {Math.round(dpi)} DPI
                              </span>
                            )}

                            {selected === p.key && (
                              <span
                                onPointerDown={(e) => onPointerDown(e, p.key, "resize")}
                                className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-surface bg-gold"
                              />
                            )}
                          </div>
                        );
                      })}
                </div>
              );
            })}
          </div>

          <p className="mt-2.5 text-center text-xs tabular-nums text-muted">
            {bbox
              ? `Khung bao ${round1(bbox.w)} × ${round1(bbox.h)} mm → bậc ${tier?.name ?? "vượt khổ lớn nhất"}`
              : zone
                ? `${zone.label} — ${zone.width_mm} × ${zone.height_mm} mm · chưa có hình`
                : ""}
          </p>

          {/* ── Chỉnh hình đang chọn ── */}
          {selectedPlacement && zone && (
            <div className="mt-4 space-y-3 rounded-card border border-line bg-surface p-4">
              {selectedPlacement.kind === "text" && (
                <div className="space-y-2.5 border-b border-line pb-3">
                  <input
                    type="text"
                    value={selectedPlacement.text?.content ?? ""}
                    onChange={(e) =>
                      updatePlacement(selectedPlacement.key, {
                        text: { ...selectedPlacement.text!, content: e.target.value },
                      })
                    }
                    maxLength={80}
                    placeholder="Nội dung dòng chữ"
                    className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm outline-none focus:border-ink"
                  />

                  <div className="flex gap-2">
                    <select
                      value={selectedPlacement.text?.fontId ?? 0}
                      onChange={(e) =>
                        updatePlacement(selectedPlacement.key, {
                          text: { ...selectedPlacement.text!, fontId: Number(e.target.value) },
                        })
                      }
                      className="min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm outline-none focus:border-ink"
                    >
                      {catalogue.fonts.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="color"
                      value={selectedPlacement.text?.color ?? "#1a1614"}
                      onChange={(e) =>
                        updatePlacement(selectedPlacement.key, {
                          text: { ...selectedPlacement.text!, color: e.target.value },
                        })
                      }
                      aria-label="Màu mực"
                      title="Màu mực"
                      className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line-strong bg-surface p-1"
                    />
                  </div>

                  <p className="text-[11px] text-muted">
                    Chữ in ra bằng vector nên nét ở mọi cỡ. Xưởng dàn chữ cho vừa đúng khung bạn kéo.
                  </p>
                </div>
              )}

              <Slider
                label="Rộng"
                min={10}
                max={Math.round(zone.width_mm)}
                value={Math.round(selectedPlacement.wMm)}
                suffix="mm"
                onChange={(v) =>
                  updatePlacement(selectedPlacement.key, {
                    wMm: v,
                    hMm: v * (selectedPlacement.hMm / selectedPlacement.wMm),
                  })
                }
              />
              <Slider
                label="Xoay"
                min={-180}
                max={180}
                value={selectedPlacement.rotation}
                suffix="°"
                onChange={(v) => updatePlacement(selectedPlacement.key, { rotation: v })}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updatePlacement(selectedPlacement.key, {
                      xMm: (zone.width_mm - selectedPlacement.wMm) / 2,
                      yMm: (zone.height_mm - selectedPlacement.hMm) / 2,
                    })
                  }
                  className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink"
                >
                  Căn giữa vùng
                </button>
                <button
                  type="button"
                  onClick={() => removePlacement(selectedPlacement.key)}
                  className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold text-[#a8452f] hover:border-[#a8452f]"
                >
                  Xoá hình
                </button>
              </div>
            </div>
          )}

          {/* ── Thêm hình ── */}
          <div className="mt-4 rounded-card border border-line bg-surface p-4">
            <label className="block cursor-pointer rounded-lg border border-dashed border-line-strong px-4 py-4 text-center transition-colors hover:border-gold hover:bg-cream-dark/40">
              <span className="block text-sm font-semibold text-ink">Tải file thiết kế của bạn</span>
              <span className="mt-0.5 block text-xs text-muted">
                {technique ? `${technique.file_types.join(", ").toUpperCase()} · tối đa 25 MB` : "PNG, PDF, SVG"}
              </span>
              <input type="file" accept="image/*,.pdf,.svg" hidden onChange={onUpload} disabled={busy} />
            </label>

            {catalogue.fonts.length > 0 && (
              <button
                type="button"
                onClick={addText}
                className="mt-3 w-full rounded-lg border border-line-strong px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-gold hover:bg-cream-dark/40"
              >
                Thêm dòng chữ
              </button>
            )}

            {catalogue.library.length > 0 && (
              <div className="mt-4">
                <p className="eyebrow text-muted">Sticker của shop</p>
                <div className="mt-2.5 grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-2">
                  {catalogue.library.map((asset) => {
                    const allowed =
                      !asset.allowed_technique_ids || asset.allowed_technique_ids.includes(design.techniqueId);

                    return (
                      <button
                        key={asset.id}
                        type="button"
                        disabled={!allowed}
                        onClick={() => addPlacement(asset.id)}
                        title={allowed ? asset.name : `${asset.name} — không dùng được với kỹ thuật đang chọn`}
                        className="relative grid aspect-square place-items-center rounded-lg border border-line bg-cream-dark/40 p-1.5 transition-colors enabled:hover:border-gold disabled:opacity-30"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={asset.url} alt={asset.name} className="h-full w-full object-contain" />
                        {asset.fee > 0 && (
                          <span className="absolute right-0.5 top-0.5 text-[9px] font-bold tabular-nums text-gold-deep">
                            {Math.round(asset.fee / 1000)}k
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Bảng kê ── */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          {notice && <Alert kind="bad">{notice}</Alert>}
          {result.errors.map((error) => (
            <Alert key={error} kind="bad">{error}</Alert>
          ))}
          {result.warnings.map((warning) => (
            <Alert key={warning} kind="warn">{warning}</Alert>
          ))}

          <div className="rounded-block border border-line bg-surface p-5">
            <p className="eyebrow text-ink/70">Bảng kê chi tiết</p>

            <div className="mt-3">
              {result.lines.map((row, i) => (
                <div
                  key={`${row.label}-${i}`}
                  className={`flex items-baseline justify-between gap-3 border-b border-dashed border-line py-2 last:border-0 ${
                    row.sub ? "pl-3.5" : ""
                  }`}
                >
                  <span className={row.sub ? "text-xs text-muted" : "text-[13px] text-ink"}>
                    {row.sub && <span className="text-gold-deep">↳ </span>}
                    {row.label}
                    {row.meta && <span className="block text-[10.5px] text-muted">{row.meta}</span>}
                  </span>
                  <span
                    className={`font-mono text-[13px] tabular-nums ${
                      row.amount < 0 ? "text-[#4f7a52]" : "text-ink"
                    }`}
                  >
                    {row.amount < 0 ? "−" : ""}
                    {formatPrice(Math.abs(row.amount))}
                  </span>
                </div>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-semibold text-muted">Số lượng áo</span>
              <input
                type="number"
                min={1}
                value={design.qty}
                onChange={(e) => patch({ qty: Math.max(1, Number(e.target.value) || 1) })}
                className="mt-1 w-28 rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm tabular-nums"
              />
            </label>

            <div className="mt-4 flex items-baseline justify-between border-t-2 border-ink pt-3">
              <span className="text-xs font-semibold text-muted">Mỗi áo</span>
              <span className="font-mono text-xl font-bold tabular-nums text-ink">
                {formatPrice(result.unitPrice)}
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xs text-muted">Tổng đơn × {design.qty}</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                {formatPrice(result.total)}
              </span>
            </div>

            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className="mt-5 w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "Đang gửi…" : design.placements.length ? "Thêm vào giỏ hàng" : "Thêm hình để tiếp tục"}
            </button>

            <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
              Shop <b className="text-ink">duyệt file thiết kế</b> trước khi in. File chưa đủ nét hoặc không in
              được thì shop báo lại và hoàn tiền đầy đủ.
            </p>
          </div>

          {blank.template_url && (
            <a
              href={blank.template_url}
              className="block rounded-card border border-line bg-surface px-4 py-3 text-center text-sm font-semibold text-ink transition-colors hover:border-gold"
            >
              Tải phôi trắng về tự thiết kế
            </a>
          )}
        </aside>
      </div>
    </main>
  );
}

// ── Mảnh nhỏ ─────────────────────────────────────────────────────────

function Chip({ children, ok }: { children: React.ReactNode; ok?: boolean }) {
  const tone =
    ok === undefined
      ? "bg-cream-dark text-muted"
      : ok
        ? "bg-[#4f7a52]/12 text-[#4f7a52]"
        : "bg-[#a8452f]/12 text-[#a8452f]";

  return <li className={`rounded-md px-2 py-1 ${tone}`}>{children}</li>;
}

function Alert({ kind, children }: { kind: "bad" | "warn"; children: React.ReactNode }) {
  const tone =
    kind === "bad"
      ? "border-[#a8452f] bg-[#a8452f]/10 text-[#a8452f]"
      : "border-gold-deep bg-gold/10 text-gold-deep";

  return <p className={`rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed ${tone}`}>{children}</p>;
}

function Slider({
  label,
  min,
  max,
  value,
  suffix,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid grid-cols-[56px_1fr_56px] items-center gap-3">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-gold-deep"
      />
      <span className="text-right font-mono text-xs tabular-nums text-ink">
        {Math.round(value)}
        {suffix}
      </span>
    </div>
  );
}
