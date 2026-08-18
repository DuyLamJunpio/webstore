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

const SECRET = process.env.WAREHOUSE_WEBHOOK_SECRET ?? "";

/** So sánh không rò rỉ qua thời gian thực thi. */
function matches(provided: string, expected: string) {
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i += 1) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(request: Request) {
  // Chưa cấu hình thì chặn hết, không im lặng cho qua: để ngỏ là ai cũng ép
  // được web gọi lại trang quản trị liên tục.
  if (!SECRET) {
    console.error("[revalidate] thiếu WAREHOUSE_WEBHOOK_SECRET — đã từ chối yêu cầu");
    return NextResponse.json({ error: "Chưa cấu hình xác thực." }, { status: 503 });
  }

  const provided = request.headers.get("x-warehouse-secret") ?? "";
  if (!matches(provided, SECRET)) {
    return NextResponse.json({ error: "Không có quyền." }, { status: 401 });
  }

  // { expire: 0 } là dạng dành riêng cho webhook: hết hạn ngay, lượt tải kế
  // tiếp đọc lại trang quản trị. Mặc định "max" sẽ còn phục vụ bản cũ thêm một
  // lượt nữa — đúng cho blog, sai cho tồn kho và giá.
  revalidateTag(CATALOGUE_TAG, { expire: 0 });

  return NextResponse.json({ revalidated: true });
}
