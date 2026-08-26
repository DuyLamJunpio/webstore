/**
 * Bộ máy tính tiền in — bản dịch cho trình duyệt.
 *
 * ĐÂY LÀ BẢN SAO, KHÔNG PHẢI NGUỒN SỰ THẬT. Nguồn là
 * `app/Services/PrintPricing.php` bên trang quản trị; file này tồn tại chỉ để
 * studio hiện giá ngay khi khách kéo hình, không phải chờ một vòng mạng cho mỗi
 * milimét. Con số tính tiền thật luôn dựng lại ở máy chủ — cùng khuôn với
 * `priceCart` trong `lib/checkout.ts`, nơi trình duyệt chỉ được nói MUA GÌ chứ
 * không được nói GIÁ BAO NHIÊU.
 *
 * Vì là bản sao nên nó phải đi đúng SÁU BƯỚC theo đúng thứ tự của bản PHP:
 *
 *   1. giá phôi (+ phụ thu size)
 *   2. giá in cơ bản — ma trận kỹ thuật × bậc khổ, tính cho từng vị trí
 *   3. phụ phí CỘNG
 *   4. hệ số NHÂN
 *   5. chiết khấu số lượng
 *   6. sàn giá rồi làm tròn
 *
 * Sửa bất cứ gì ở đây mà không sửa bên PHP là hai bên báo hai con số khác nhau,
 * và khách sẽ thấy nó ngay ở bước thanh toán. Bộ ca kiểm thử chuẩn nằm ở
 * `Warehouse.WED/tests/Unit/PrintPricingTest.php`.
 */

// ── Dữ liệu từ trang quản trị ────────────────────────────────────────

export type PrintTechnique = {
  id: number;
  name: string;
  slug: string;
  /** null = không giới hạn (decal, DTG). 6 = in lụa. */
  max_colors: number | null;
  accepts_photo: boolean;
  accepts_gradient: boolean;
  needs_underbase: boolean;
  min_dpi: number;
  file_types: string[];
  lead_days: number;
  moq: number;
  is_active: boolean;
};

export type PrintSizeTier = {
  id: number;
  name: string;
  width_mm: number;
  height_mm: number;
};

/** Ngữ pháp quy tắc — ĐÓNG. Thêm điều kiện mới là phải sửa cả bản PHP. */
export type PrintRule = {
  id: string;
  label: string;
  enabled: boolean;
  when: {
    technique_ids?: number[];
    position_keys?: string[];
    /** tên cũ của `position_keys`, còn trong các bảng giá đã xuất bản từ trước */
    zone_keys?: string[];
    tier_ids?: number[];
    tone?: "light" | "dark";
    blank_ids?: number[];
    qty_from?: number;
    qty_to?: number;
    ink_colors_from?: number;
  };
  apply: {
    kind: "add" | "multiply" | "percent";
    amount: number;
    /** `"zone"` là tên cũ của `"position"` — xem normalisePer. */
    per: "order" | "shirt" | "position" | "placement" | "inkColor" | "zone";
  };
};

export type PrintPricingData = {
  techniques: PrintTechnique[];
  tiers: PrintSizeTier[];
  /** cells[technique_id][tier_id] — thiếu khoá = kỹ thuật đó không nhận khổ đó */
  cells: Record<string, Record<string, number>>;
  rules: PrintRule[];
  qty_tiers: { from: number; pct: number }[];
  rounding: number;
  min_charge: number;
};

/**
 * Một trong bốn chỗ in được trên áo. Định nghĩa nằm ở trang quản trị
 * (App\Services\PrintPositions) và đi theo catalogue sang đây — KHÔNG chép lại,
 * vì chép là sớm muộn hai bên lệch trần milimét và studio cho khách kéo một khổ
 * mà máy chủ từ chối ngay sau đó.
 */
export type PrintPosition = {
  key: string;
  label: string;
  /** góc chụp muốn dùng, lùi dần khi phôi thiếu tấm */
  views: string[];
  /** trần của xưởng, không phải khung in: bên trong nó khách kéo tuỳ ý */
  max_width_mm: number;
  max_height_mm: number;
};

export type PrintColor = { id: number; name: string; hex: string; tone: "light" | "dark" };

export type PrintMockup = {
  color_id: number | null;
  view: string;
  url: string;
  width_px: number;
  height_px: number;
  offset_x: number;
  offset_y: number;
};

/**
 * Danh mục phôi — dùng chung bảng danh mục với hàng bán sẵn bên trang quản trị.
 *
 * Không dựng một cây danh mục riêng cho phôi: "Áo thun" là "Áo thun" dù chiếc áo
 * đó đang trên kệ hay đang chờ in hình lên.
 */
export type PrintBlankCategory = { id: number; name: string; slug: string };

export type PrintBlank = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  base_price: number;
  product_id: number | null;
  /**
   * null = phôi chưa xếp danh mục; thiếu hẳn khoá = trang quản trị đời cũ chưa
   * biết tới danh mục phôi. Hai trường hợp cùng rơi vào nhóm "Khác" trên trang
   * chọn phôi, nên không cần phân biệt ở chỗ nào khác.
   */
  category?: PrintBlankCategory | null;
  frame_width_mm: number;
  frame_height_mm: number;
  moq: number;
  lead_days: number;
  template_url: string | null;
  technique_ids: number[];
  sizes: string[];
  size_surcharge: Record<string, number>;
  colors: PrintColor[];
  /** vị trí phôi này bán được, tham chiếu vào `PrintCatalogue.positions` */
  position_keys: string[];
  mockups: PrintMockup[];
};

export type PrintAsset = {
  id: number;
  name: string;
  tag: string | null;
  url: string;
  width_px: number;
  height_px: number;
  has_alpha: boolean;
  fee: number;
  /** null = mọi kỹ thuật */
  allowed_technique_ids: number[] | null;
  min_width_mm: number;
  max_width_mm: number;
};

export type PrintCatalogue = PrintPricingData & {
  pricing_version_id: number | null;
  positions: PrintPosition[];
  blanks: PrintBlank[];
  library: PrintAsset[];
  fonts: PrintFont[];
};

// ── Chọn phôi ────────────────────────────────────────────────────────

/** Ảnh đại diện của một phôi: ưu tiên mockup của màu đầu tiên. */
export function coverMockup(blank: PrintBlank) {
  const firstColor = blank.colors[0];

  return blank.mockups.find((m) => m.color_id === firstColor?.id) ?? blank.mockups[0] ?? null;
}

/** Một nút lọc trên trang chọn phôi. `slug` rỗng = nhóm phôi chưa xếp danh mục. */
export type BlankCategoryFacet = { slug: string; name: string; count: number };

/** Khoá của nhóm "chưa xếp danh mục" — rỗng vì nó không phải một danh mục thật. */
export const UNSORTED_BLANKS = "";

/**
 * Hàng nút lọc, gom từ CHÍNH những phôi sắp bày ra.
 *
 * Không đọc bảng danh mục: một mục chưa có phôi nào đặt được mà vẫn hiện thành
 * nút thì khách bấm vào một trang trống — lỗi khó chịu hơn hẳn việc thiếu một
 * nút chưa dùng tới.
 *
 * Thứ tự nút đi theo thứ tự phôi từ trang quản trị, nên chủ shop xếp phôi thế
 * nào là hàng nút hiện ra thế ấy. Nhóm "Khác" luôn đứng cuối.
 *
 * Trả về danh sách RỖNG khi chưa phôi nào được xếp danh mục — lúc đó một hàng
 * nút chỉ có mỗi "Tất cả" là thứ trang trí vô nghĩa, ẩn hẳn đi thì hơn.
 */
export function blankCategories(blanks: PrintBlank[]): BlankCategoryFacet[] {
  const facets = new Map<string, BlankCategoryFacet>();

  for (const blank of blanks) {
    const category = blank.category ?? null;
    const slug = category?.slug ?? UNSORTED_BLANKS;
    const existing = facets.get(slug);

    if (existing) {
      existing.count += 1;
      continue;
    }

    facets.set(slug, { slug, name: category?.name ?? "Khác", count: 1 });
  }

  const unsorted = facets.get(UNSORTED_BLANKS);
  facets.delete(UNSORTED_BLANKS);

  if (facets.size === 0) {
    return [];
  }

  return unsorted ? [...facets.values(), unsorted] : [...facets.values()];
}

// ── Thiết kế của khách ───────────────────────────────────────────────

/** Phông chữ shop in được. Khách chỉ chọn được trong số này. */
export type PrintFont = {
  id: number;
  name: string;
  /** ngăn xếp CSS, dùng thẳng làm `font-family` */
  family: string;
  url: string | null;
};

/** Phần riêng của một placement chữ. */
export type PlacementText = {
  content: string;
  fontId: number;
  /** mã màu mực, ví dụ "#1a1614" */
  color: string;
};

/**
 * Một thứ đã đặt lên áo — ảnh hoặc chữ. Toạ độ tính bằng mm từ góc trên trái
 * của KHUNG ẢNH phôi, tức là cả chiếc áo trong tấm mockup. Không còn khung vùng
 * in nào ở giữa để quy chiếu, nên hai số hiệu chuẩn của phôi là toàn bộ cầu nối
 * giữa cái khách kéo trên màn hình và milimét thật trên vải.
 *
 * Hai loại dùng CHUNG một hình dạng vì mọi thứ downstream đối xử với chúng như
 * nhau: khung bao, bậc khổ, tiền in, bảng toạ độ cho thợ. Chỗ khác nhau duy nhất
 * là cái gì được vẽ vào trong khung đó.
 */
export type Placement = {
  /** id cục bộ trong trình duyệt, không gửi lên máy chủ */
  key: string;
  position: string;
  kind: "image" | "text";
  /** chỉ với kind = "image" */
  assetId: number | null;
  /** chỉ với kind = "text" */
  text?: PlacementText;
  xMm: number;
  yMm: number;
  wMm: number;
  hMm: number;
  rotation: number;
};

export type DesignState = {
  blankId: number;
  colorName: string;
  size: string;
  techniqueId: number;
  inkColors: number;
  qty: number;
  placements: Placement[];
};

export type QuoteLine = { label: string; meta: string | null; amount: number; sub: boolean };

export type Quote = {
  lines: QuoteLine[];
  unitPrice: number;
  total: number;
  errors: string[];
  warnings: string[];
};

// ── Hình học ─────────────────────────────────────────────────────────

/**
 * Khung bao trục-thẳng của MỘT hình đã xoay, tính bằng mm.
 *
 * Hình xoay 45° chiếm chỗ rộng hơn chính nó, và thợ in phải cắt decal theo phần
 * chiếm chỗ đó — tính tiền theo hình chưa xoay là tính thiếu.
 */
function placementBox(p: Placement) {
  const rad = (p.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));

  const w = p.wMm * cos + p.hMm * sin;
  const h = p.wMm * sin + p.hMm * cos;
  const cx = p.xMm + p.wMm / 2;
  const cy = p.yMm + p.hMm / 2;

  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/**
 * Khung bao chung của mọi hình trong CÙNG một vị trí.
 *
 * Đây là chỗ quyết định cách tính tiền: gộp lại rồi mới quy ra khổ, nên ba
 * sticker nhỏ nằm gọn trong A5 tính tiền A5 chứ không phải ba lần tiền.
 */
export function boundingBox(placements: Placement[]) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;

  for (const p of placements) {
    const b = placementBox(p);
    x0 = Math.min(x0, b.x);
    y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.w);
    y1 = Math.max(y1, b.y + b.h);
  }

  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * Bậc khổ NHỎ NHẤT chứa được khung bao; null nếu vượt bậc lớn nhất.
 *
 * Cho phép xoay 90°: khung 200×140 vừa khổ A5 dựng đứng 148×210 nếu quay ngang,
 * và xưởng in vẫn cắt được từ đúng tờ decal đó.
 */
export function pickTier(bbox: { w: number; h: number }, tiers: PrintSizeTier[]): PrintSizeTier | null {
  const sorted = [...tiers].sort((a, b) => a.width_mm * a.height_mm - b.width_mm * b.height_mm);

  return (
    sorted.find(
      (t) =>
        (bbox.w <= t.width_mm + 0.5 && bbox.h <= t.height_mm + 0.5) ||
        (bbox.w <= t.height_mm + 0.5 && bbox.h <= t.width_mm + 0.5),
    ) ?? null
  );
}

/**
 * DPI thật khi hình được in ở bề rộng này — thứ quyết định in ra có rỗ không.
 *
 * Chữ không đi qua đây: nó là vector, phóng bao nhiêu cũng nét.
 */
export const dpiAt = (asset: PrintAsset | undefined, widthMm: number) =>
  !asset || widthMm <= 0 ? 0 : asset.width_px / (widthMm / 25.4);

// ── Ngữ pháp quy tắc ─────────────────────────────────────────────────

type RuleContext = {
  techniqueId: number;
  blankId: number;
  tone: "light" | "dark";
  qty: number;
  inkColors: number;
  positionKey: string | null;
  tierId: number | null;
};

/** Mọi điều kiện đều AND; điều kiện vắng mặt = không xét. */
function ruleMatches(rule: PrintRule, ctx: RuleContext): boolean {
  const w = rule.when;

  if (w.technique_ids && !w.technique_ids.includes(ctx.techniqueId)) return false;

  // `zone_keys` là tên cũ, còn nằm trong các bảng giá đã xuất bản từ trước.
  const positionKeys = w.position_keys ?? w.zone_keys;
  if (positionKeys && (ctx.positionKey === null || !positionKeys.includes(ctx.positionKey))) return false;

  if (w.tier_ids && (ctx.tierId === null || !w.tier_ids.includes(ctx.tierId))) return false;
  if (w.tone && w.tone !== ctx.tone) return false;
  if (w.blank_ids && !w.blank_ids.includes(ctx.blankId)) return false;
  if (w.qty_from != null && ctx.qty < w.qty_from) return false;
  if (w.qty_to != null && ctx.qty > w.qty_to) return false;
  if (w.ink_colors_from != null && ctx.inkColors < w.ink_colors_from) return false;

  return true;
}

export const PER_LABELS: Record<PrintRule["apply"]["per"], string> = {
  order: "mỗi đơn",
  shirt: "mỗi áo",
  position: "mỗi vị trí",
  placement: "mỗi hình",
  inkColor: "mỗi màu mực",
  zone: "mỗi vị trí",
};

/** Đọc `per` của một quy tắc, hiểu cả tên cũ lẫn tên mới. */
const normalisePer = (per: PrintRule["apply"]["per"] | undefined): PrintRule["apply"]["per"] =>
  per === undefined ? "order" : per === "zone" ? "position" : per;

/** Ba đơn vị này tính riêng từng vị trí; hai đơn vị còn lại tính trên cả đơn. */
const PER_POSITION_SCOPED: PrintRule["apply"]["per"][] = ["position", "placement", "inkColor"];

const line = (label: string, amount: number, meta: string | null = null, sub = false): QuoteLine => ({
  label,
  meta,
  amount: Math.round(amount),
  sub,
});

const r1 = (n: number) => Math.round(n * 10) / 10;

// ── Báo giá ──────────────────────────────────────────────────────────

export function quote(
  design: DesignState,
  blank: PrintBlank,
  pricing: PrintCatalogue,
  assets: Map<number, PrintAsset>,
): Quote {
  const lines: QuoteLine[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  const technique = pricing.techniques.find((t) => t.id === design.techniqueId);
  if (!technique) {
    return { lines: [], unitPrice: 0, total: 0, errors: ["Chưa chọn được kỹ thuật in."], warnings: [] };
  }

  const qty = Math.max(1, design.qty);
  const inkColors = Math.max(1, design.inkColors);
  const color = blank.colors.find((c) => c.name === design.colorName) ?? blank.colors[0];
  const tone = color?.tone ?? "light";

  // Vị trí phôi này bán được — cùng bộ dữ liệu mà máy chủ dựng lại lúc chốt.
  const positions = new Map(
    pricing.positions.filter((p) => blank.position_keys.includes(p.key)).map((p) => [p.key, p]),
  );

  // ── BƯỚC 1 — giá phôi ──────────────────────────────────────────────
  const surcharge = blank.size_surcharge[design.size] ?? 0;
  let running = blank.base_price + surcharge;

  lines.push(
    line(
      `${blank.name} — ${design.colorName}, size ${design.size}`,
      blank.base_price,
      blank.product_id ? `nối kho · sản phẩm #${blank.product_id}` : "phôi đứng riêng",
    ),
  );
  if (surcharge) lines.push(line(`phụ thu size ${design.size}`, surcharge, null, true));

  // ── BƯỚC 2 — giá in cơ bản, tính riêng từng vị trí ─────────────────
  const byPosition = new Map<string, Placement[]>();
  for (const p of design.placements) {
    const list = byPosition.get(p.position);
    if (list) list.push(p);
    else byPosition.set(p.position, [p]);
  }

  const positionContexts: {
    positionKey: string;
    positionLabel: string;
    tierId: number;
    base: number;
    count: number;
  }[] = [];

  for (const [positionKey, list] of byPosition) {
    const position = positions.get(positionKey);

    // Bỏ qua trong im lặng là hình của khách biến mất khỏi bảng kê mà vẫn nằm
    // trong thiết kế gửi đi — khách trả tiền một đằng, xưởng in một nẻo.
    if (!position) {
      errors.push(`Vị trí in "${positionKey}" không còn nhận đơn trên phôi này.`);
      continue;
    }

    const bbox = boundingBox(list);

    // Trần mm của vị trí — giới hạn của cái máy in, không phải khung in cũ quay
    // lại dưới tên khác: bên trong trần đó khách kéo đi đâu, to nhỏ ra sao tuỳ ý.
    if (bbox.w > position.max_width_mm + 0.5 || bbox.h > position.max_height_mm + 0.5) {
      errors.push(
        `${position.label}: khung bao ${r1(bbox.w)}×${r1(bbox.h)} mm vượt giới hạn ` +
          `${position.max_width_mm}×${position.max_height_mm} mm của vị trí này.`,
      );
      continue;
    }

    const tier = pickTier(bbox, pricing.tiers);

    if (!tier) {
      errors.push(`${position.label}: khung bao ${r1(bbox.w)}×${r1(bbox.h)} mm vượt bậc khổ lớn nhất.`);
      continue;
    }

    const cell = pricing.cells[String(technique.id)]?.[String(tier.id)];
    if (cell == null) {
      errors.push(
        `${technique.name} không nhận khổ ${tier.name} — đổi kỹ thuật hoặc thu nhỏ hình ở ${position.label}.`,
      );
      continue;
    }

    lines.push(
      line(
        `${technique.name} · ${position.label} · khổ ${tier.name}`,
        cell,
        `khung bao ${r1(bbox.w)} × ${r1(bbox.h)} mm · ${list.length} hình`,
      ),
    );
    running += cell;

    positionContexts.push({
      positionKey,
      positionLabel: position.label,
      tierId: tier.id,
      base: cell,
      count: list.length,
    });
  }

  // Sticker có bản quyền — phí gắn với tài nguyên, không gắn với vị trí. Chữ do
  // khách tự gõ nên không có phí bản quyền nào.
  for (const p of design.placements) {
    const asset = p.assetId === null ? undefined : assets.get(p.assetId);
    if (asset?.fee) {
      lines.push(line(`Sticker "${asset.name}"`, asset.fee, "có tính phí", true));
      running += asset.fee;
    }
  }

  if (!positionContexts.length && !errors.length) {
    warnings.push("Chưa có hình nào trên áo — mới tính tiền phôi.");
  }

  const baseCtx = { techniqueId: technique.id, blankId: blank.id, tone, qty, inkColors };

  // ── BƯỚC 3 — phụ phí CỘNG ──────────────────────────────────────────
  for (const rule of pricing.rules) {
    if (!rule.enabled || rule.apply.kind !== "add") continue;
    const { amount } = rule.apply;
    const per = normalisePer(rule.apply.per);

    if (PER_POSITION_SCOPED.includes(per)) {
      for (const pc of positionContexts) {
        if (!ruleMatches(rule, { ...baseCtx, positionKey: pc.positionKey, tierId: pc.tierId })) continue;

        let multiplier = 1;
        let note: string | null = null;

        if (per === "placement") {
          multiplier = pc.count;
          note = `${pc.count} hình`;
        }
        if (per === "inkColor") {
          // Đếm từ ngưỡng của chính quy tắc trở đi: "từ màu thứ 2" với đơn 4 màu
          // là tính tiền 3 màu, không phải 4.
          const from = rule.when.ink_colors_from ?? 1;
          multiplier = Math.max(0, inkColors - (from - 1));
          note = `${multiplier} màu tính phí`;
        }
        if (multiplier <= 0) continue;

        const delta = amount * multiplier;
        lines.push(line(`${rule.label} — ${pc.positionLabel}`, delta, note, true));
        running += delta;
      }
      continue;
    }

    if (!ruleMatches(rule, { ...baseCtx, positionKey: null, tierId: null })) continue;

    /*
     * `mỗi đơn` phải chia đều cho số áo TRƯỚC khi cộng.
     *
     * Cả bộ máy này tính GIÁ MỘT ÁO, và tổng đơn là đơn giá nhân số lượng — bất
     * biến mà giỏ hàng, PayOS và hoá đơn đều dựa vào. Cộng thẳng một khoản
     * "mỗi đơn" vào đơn giá là nó bị nhân lên theo số áo.
     */
    const share = per === "order" ? amount / qty : amount;
    const note =
      per === "order" && qty > 1
        ? `${new Intl.NumberFormat("vi-VN").format(amount)} ₫ chia đều ${qty} áo`
        : PER_LABELS[per];

    lines.push(line(rule.label, share, note, true));
    running += share;
  }

  // ── BƯỚC 4 — hệ số NHÂN ────────────────────────────────────────────
  for (const rule of pricing.rules) {
    if (!rule.enabled) continue;
    const { kind, amount } = rule.apply;
    const per = normalisePer(rule.apply.per);
    if (kind !== "multiply" && kind !== "percent") continue;

    const factor = kind === "multiply" ? amount : 1 + amount / 100;
    const note = kind === "multiply" ? `×${amount}` : `+${amount}%`;

    if (PER_POSITION_SCOPED.includes(per)) {
      for (const pc of positionContexts) {
        if (!ruleMatches(rule, { ...baseCtx, positionKey: pc.positionKey, tierId: pc.tierId })) continue;

        // Nhân trên GIÁ IN CƠ BẢN của vị trí, không trên tổng đang chạy: "mặt
        // sau khó căn hơn" nói về công in mặt sau, không phải về tiền phôi.
        const delta = pc.base * (factor - 1);
        lines.push(line(`${rule.label} — ${pc.positionLabel}`, delta, note, true));
        running += delta;
      }
      continue;
    }

    if (!ruleMatches(rule, { ...baseCtx, positionKey: null, tierId: null })) continue;
    const delta = running * (factor - 1);
    lines.push(line(rule.label, delta, `${note} trên toàn đơn`, true));
    running += delta;
  }

  // ── BƯỚC 5 — chiết khấu số lượng ───────────────────────────────────
  const qtyTier = pricing.qty_tiers
    .filter((q) => qty >= q.from)
    .sort((a, b) => b.from - a.from)[0];

  if (qtyTier && qtyTier.pct > 0) {
    const delta = -running * (qtyTier.pct / 100);
    lines.push(line(`Chiết khấu từ ${qtyTier.from} áo`, delta, `−${qtyTier.pct}%`));
    running += delta;
  }

  // ── BƯỚC 6 — sàn giá rồi làm tròn ──────────────────────────────────
  if (pricing.min_charge > 0 && running < pricing.min_charge) {
    lines.push(line("Nâng lên sàn giá mỗi áo", pricing.min_charge - running));
    running = pricing.min_charge;
  }

  if (pricing.rounding > 0) {
    const rounded = Math.ceil(running / pricing.rounding) * pricing.rounding;
    if (Math.abs(rounded - running) > 0.001) {
      const label = `Làm tròn lên bội số ${new Intl.NumberFormat("vi-VN").format(pricing.rounding)} ₫`;
      lines.push(line(label, rounded - running, null, true));
    }
    running = rounded;
  }

  const unitPrice = Math.round(running);

  // ── Ràng buộc của kỹ thuật — đọc từ dữ liệu, không if theo tên ──────
  if (technique.max_colors !== null && inkColors > technique.max_colors) {
    errors.push(`${technique.name} chỉ in tối đa ${technique.max_colors} màu, đang khai ${inkColors}.`);
  }
  if (qty < technique.moq) warnings.push(`${technique.name} nhận đơn tối thiểu ${technique.moq} áo.`);
  if (qty < blank.moq) warnings.push(`Phôi "${blank.name}" nhận đơn tối thiểu ${blank.moq} áo.`);

  return { lines, unitPrice, total: unitPrice * qty, errors, warnings };
}
