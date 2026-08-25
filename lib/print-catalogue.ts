/**
 * Nạp dữ liệu module in từ trang quản trị.
 *
 * Cùng khuôn với `lib/catalogue.ts`: đọc thẳng lúc chạy, có nhãn cache để trang
 * quản trị xoá được sau khi lưu, và trần thời gian dữ liệu cũ tính bằng giây.
 *
 * KHÁC một điểm quan trọng: không có bản chụp dự phòng. Catalogue sản phẩm hỏng
 * thì thà bày hàng hơi cũ còn hơn trang trắng; còn ở đây, báo giá bằng một bảng
 * giá cũ là báo sai tiền cho khách. Gọi không được thì trả `null` và trang in
 * nói thẳng "tạm ngưng nhận đơn".
 *
 * Chỉ dùng ở phía máy chủ. Client component nhận dữ liệu qua props.
 */

import { cache } from "react";
import type { PrintCatalogue } from "./print";

/** Nhãn cache để trang quản trị xoá được sau khi xuất bản bảng giá. */
export const PRINT_TAG = "print-catalogue";

const REVALIDATE_SECONDS = 60;
const TIMEOUT_MS = 10_000;

const BASE = (process.env.WAREHOUSE_API_URL ?? "").replace(/\/$/, "");

async function fetchCatalogue(): Promise<PrintCatalogue | null> {
  if (!BASE) {
    console.error("[in-ao] thiếu WAREHOUSE_API_URL — không nạp được phôi in");
    return null;
  }

  try {
    const response = await fetch(`${BASE}/api/storefront/print/catalogue`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS, tags: [PRINT_TAG] },
    });

    if (!response.ok) {
      console.error(`[in-ao] trang quản trị trả về HTTP ${response.status}`);
      return null;
    }

    const data = (await response.json()) as PrintCatalogue;

    // Sai kiểu là lỗi thật phía quản trị, không phải "chưa có phôi nào".
    if (!Array.isArray(data?.blanks) || !Array.isArray(data?.techniques)) {
      console.error("[in-ao] trang quản trị trả về dữ liệu sai kiểu");
      return null;
    }

    return data;
  } catch (error) {
    console.error("[in-ao] không nạp được dữ liệu in", error);
    return null;
  }
}

/** Gộp một lần cho mỗi request — nhiều component cùng cần bộ dữ liệu này. */
export const getPrintCatalogue = cache(fetchCatalogue);

/**
 * Chỉ những phôi thật sự đặt được.
 *
 * Phôi chưa khai vùng in hoặc chưa gắn kỹ thuật nào có giá thì studio không
 * dựng nổi màn hình — bày ra chỉ để khách bấm vào rồi gặp trang trống.
 */
export function bookableBlanks(catalogue: PrintCatalogue) {
  const priced = new Set(
    catalogue.techniques
      .filter((t) => Object.keys(catalogue.cells[String(t.id)] ?? {}).length > 0)
      .map((t) => t.id),
  );

  return catalogue.blanks.filter(
    (blank) => blank.zones.length > 0 && blank.technique_ids.some((id) => priced.has(id)),
  );
}

/** Ảnh đại diện của một phôi: ưu tiên mockup của màu đầu tiên. */
export function coverMockup(blank: PrintCatalogue["blanks"][number]) {
  const firstColor = blank.colors[0];

  return (
    blank.mockups.find((m) => m.color_id === firstColor?.id) ??
    blank.mockups[0] ??
    null
  );
}
