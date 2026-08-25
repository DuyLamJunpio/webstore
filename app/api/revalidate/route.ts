/**
 * Trang quản trị gọi vào đây sau khi lưu sản phẩm, ảnh, biến thể hay danh mục.
 *
 * Không có nó thì web vẫn tự làm mới sau `REVALIDATE_SECONDS`; có nó thì thay
 * đổi lên web ngay, không phải chờ và không phải chạy lệnh gì bằng tay.
 *
 * Chặng server-to-server nên bí mật dùng chung là đủ — cùng giá trị với
 * `WAREHOUSE_WEBHOOK_SECRET` mà web dùng khi báo đã thanh toán, chỉ đổi chiều.
 */

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CATALOGUE_TAG } from "@/lib/catalogue";
import { CONTENT_TAG } from "@/lib/content";
import { PRINT_TAG } from "@/lib/print-catalogue";
import { rejectUnlessWarehouse } from "@/lib/warehouse-auth";

export async function POST(request: Request) {
  // Để ngỏ là ai cũng ép được web gọi lại trang quản trị liên tục.
  const rejected = rejectUnlessWarehouse(request, "revalidate");
  if (rejected) return rejected;

  // { expire: 0 } là dạng dành riêng cho webhook: hết hạn ngay, lượt tải kế
  // tiếp đọc lại trang quản trị. Mặc định "max" sẽ còn phục vụ bản cũ thêm một
  // lượt nữa — đúng cho blog, sai cho tồn kho và giá.
  // Xoá cả ba nhãn: quản trị chỉ gọi một lần dù vừa sửa sản phẩm, banner hay
  // vừa xuất bản bảng giá in — bên đó không biết web chia dữ liệu làm mấy nhãn.
  revalidateTag(CATALOGUE_TAG, { expire: 0 });
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidateTag(PRINT_TAG, { expire: 0 });

  return NextResponse.json({ revalidated: true });
}
