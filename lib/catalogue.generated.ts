/**
 * SINH TỰ ĐỘNG — đừng sửa tay, chạy lại sẽ mất.
 *
 *   npm run import:shopee -- <đường-dẫn-file.json>
 *
 * Bao lâu mảng này còn rỗng thì `lib/data.ts` dùng catalogue mẫu, nên trang
 * không bao giờ trống. Import xong là hàng thật thay thế toàn bộ.
 */

import type { Seed } from "./data";

export const shopeeSeeds: Seed[] = [];

/** để README / trang quản trị biết dữ liệu lấy lúc nào */
export const importedAt: string | null = null;
