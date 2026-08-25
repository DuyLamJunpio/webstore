/**
 * Một mẫu thiết kế in khi nó đi vào giỏ hàng và bước thanh toán.
 *
 * Giá ở đây ĐÃ ĐÓNG BĂNG từ lúc khách chốt thiết kế, kèm id phiên bản bảng giá
 * đã dùng. Không tính lại — chủ shop có thể đã sửa bảng giá trong lúc khách còn
 * đang điền địa chỉ, và con số khách nhìn thấy lúc bấm "Chốt thiết kế" mới là
 * con số phải thu.
 *
 * Trình duyệt có giữ một bản sao trong localStorage để hiện cho nhanh, nhưng
 * bản đó chỉ để NHÌN. Máy chủ luôn hỏi lại trang quản trị trước khi tính tiền,
 * đúng như `priceCart` không tin giá nào trong giỏ hàng.
 */

export type PrintOrderDesign = {
  code: string;
  blank_name: string | null;
  blank_slug: string | null;
  technique_name: string | null;
  color_name: string;
  size: string;
  qty: number;
  /** đồng, mỗi áo */
  unit_price: number;
  /** đồng, đã nhân số lượng */
  total_price: number;
  lines: { label: string; meta: string | null; amount: number; sub: boolean }[];
  lead_days: number;
  review_status: "draft" | "pending" | "approved" | "rejected";
  /** true khi mẫu này đã nằm trong một đơn rồi — mở lại tab cũ là gặp ngay */
  already_ordered: boolean;
  thumb_url: string | null;
};

/** Khoá localStorage giữ mẫu khách vừa chốt, chờ mang sang trang thanh toán. */
export const PRINT_DRAFT_KEY = "tbc.print.v1";

const BASE = (process.env.WAREHOUSE_API_URL ?? "").replace(/\/$/, "");
const SECRET = process.env.WAREHOUSE_WEBHOOK_SECRET ?? "";

const TIMEOUT_MS = 10_000;

/**
 * Đọc lại mẫu thiết kế từ trang quản trị. CHỈ chạy phía máy chủ — nó mang bí mật
 * dùng chung, và nó là nguồn giá duy nhất được phép tin lúc chốt đơn.
 */
export async function fetchPrintDesign(code: string): Promise<PrintOrderDesign | null> {
  if (!BASE || !SECRET) {
    console.error("[in-ao] thiếu WAREHOUSE_API_URL hoặc WAREHOUSE_WEBHOOK_SECRET");
    return null;
  }

  try {
    const response = await fetch(`${BASE}/api/storefront/print/designs/${encodeURIComponent(code)}`, {
      headers: { Accept: "application/json", "X-Storefront-Secret": SECRET },
      // Giá của một mẫu là bất biến, nhưng `already_ordered` thì không — nên
      // không được đệm câu trả lời này.
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) return null;

    return (await response.json()) as PrintOrderDesign;
  } catch (error) {
    console.error("[in-ao] không đọc được mẫu thiết kế", error);
    return null;
  }
}

/** Dòng hiển thị của mẫu in trong giỏ hàng và trang thanh toán. */
export const printLineLabel = (design: PrintOrderDesign) =>
  [design.blank_name, design.color_name, `size ${design.size}`].filter(Boolean).join(" · ");
