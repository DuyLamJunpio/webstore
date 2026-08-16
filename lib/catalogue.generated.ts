/**
 * SINH TỰ ĐỘNG — đừng sửa tay, chạy lại sẽ mất.
 *
 *   npm run sync:shopee                              (API chính thức)
 *   npm run import:shopee -- <đường-dẫn-file.json>   (JSON lưu từ trình duyệt)
 *
 * Bao lâu mảng này còn rỗng thì `lib/data.ts` dùng catalogue mẫu, nên trang
 * không bao giờ trống. Đồng bộ xong là hàng thật thay thế toàn bộ.
 */

import type { Seed } from "./data";

export const shopeeSeeds: Seed[] = [];

/** Danh mục thật của shop, xếp theo số sản phẩm giảm dần. */
export const shopeeCategories: Array<{ name: string; count: number }> = [];

/** để README / trang quản trị biết dữ liệu lấy lúc nào */
export const importedAt: string | null = null;
