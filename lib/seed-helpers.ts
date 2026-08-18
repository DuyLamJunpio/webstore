/**
 * Những phép biến đổi thuần tuý dùng chung cho mọi đường nhập hàng: trang quản
 * trị (đọc thẳng lúc chạy hoặc qua `npm run sync:warehouse`) và Shopee.
 *
 * Tách khỏi `scripts/seed-format.mts` vì file đó có `downloadImage` kéo theo
 * `node:fs` — thứ không nên lọt vào gói của web.
 */

// ── tiếng Việt → slug ASCII ──────────────────────────────────────────

const COMBINING = /[\u0300-\u036f]/g;

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(COMBINING, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "san-pham";

// ── đoán màu → mã hex cho ô swatch ───────────────────────────────────

/**
 * Nguồn hàng chỉ cho tên màu dạng chữ ("Trắng kem", "Xanh navy"), còn giao diện
 * cần một mã màu để vẽ ô tròn. Bảng này dò theo từ khoá; không khớp thì dùng
 * màu be trung tính của thương hiệu — sai màu thì sửa tay một dòng, còn hơn là
 * bịa ra một mã hex ngẫu nhiên.
 */
const COLOR_HINTS: Array<[RegExp, string]> = [
  [/trắng|white|kem|cream|sữa|ivory/i, "#f0e7d8"],
  [/đen|black|mực/i, "#1c1714"],
  [/xám|ghi|grey|gray/i, "#c9c6bd"],
  [/be|beige|nude|cát|sand|kaki|khaki/i, "#d8c4a4"],
  [/nâu|brown|socola|chocolate|cafe|cà phê/i, "#4a3728"],
  [/hồng|pink|ruốc/i, "#e2b3b8"],
  [/đỏ|red|burgundy|đô/i, "#a8503a"],
  [/cam|orange|apricot/i, "#d98441"],
  [/vàng|yellow|mustard|bơ/i, "#d9b45b"],
  [/xanh lá|green|rêu|olive|mint|lá/i, "#6b6a45"],
  [/xanh dương|navy|blue|biển|chàm|denim/i, "#3d4a63"],
  [/tím|purple|lavender|lilac/i, "#8a7aa8"],
];

export const hexFor = (name: string) => COLOR_HINTS.find(([re]) => re.test(name))?.[1] ?? "#d8c4a4";

// ── đoán đối tượng từ tên sản phẩm ───────────────────────────────────

const AUDIENCE_HINTS: Array<[RegExp, "Nam" | "Nữ" | "Trẻ em"]> = [
  [/trẻ em|bé trai|bé gái|kids|baby|em bé/i, "Trẻ em"],
  [/nữ|women|girl|đầm|chân váy/i, "Nữ"],
  [/nam|men(?!t)|boy/i, "Nam"],
];

/**
 * Chỉ dùng khi bên quản trị chưa khai đối tượng. Không khớp gì thì Unisex —
 * bộ lọc vẫn hiện sản phẩm ra thay vì giấu mất.
 */
export const audienceFor = (...texts: string[]) => {
  const haystack = texts.filter(Boolean).join(" ");
  return AUDIENCE_HINTS.find(([re]) => re.test(haystack))?.[1] ?? "Unisex";
};
