/**
 * POST /api/print/designs — chốt một mẫu áo khách vừa thiết kế.
 *
 * Trình duyệt chỉ được nói THIẾT KẾ gồm những gì: phôi nào, kỹ thuật nào, hình
 * đặt ở toạ độ mm nào. Giá do trang quản trị tính lại từ bảng giá đang áp dụng
 * và đóng băng vào bản ghi — đúng cách `priceCart` không tin số tiền nào đến từ
 * localStorage.
 *
 * Trả về mã thiết kế; mã đó là thứ đi tiếp vào giỏ hàng và đơn hàng.
 */

import type { NextRequest } from "next/server";

const BASE = (process.env.WAREHOUSE_API_URL ?? "").replace(/\/$/, "");
const SECRET = process.env.WAREHOUSE_WEBHOOK_SECRET ?? "";

const TIMEOUT_MS = 15_000;

export async function POST(request: NextRequest) {
  if (!BASE || !SECRET) {
    console.error("[in-ao] thiếu WAREHOUSE_API_URL hoặc WAREHOUSE_WEBHOOK_SECRET");
    return Response.json({ error: "Dịch vụ in đang tạm ngưng nhận đơn." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Dữ liệu thiết kế không hợp lệ." }, { status: 400 });
  }

  try {
    const response = await fetch(`${BASE}/api/storefront/print/designs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Storefront-Secret": SECRET,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // 422 gần như luôn là lỗi nghiệp vụ đọc được — hình vượt khổ, kỹ thuật
      // không nhận khổ đó. Nói thẳng câu của máy chủ cho khách sửa được.
      const validation = data?.errors ? Object.values(data.errors).flat().join(" ") : undefined;

      return Response.json(
        { error: data?.error ?? validation ?? "Không lưu được thiết kế. Vui lòng thử lại." },
        { status: response.status },
      );
    }

    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error("[in-ao] không gửi được thiết kế sang trang quản trị", error);
    return Response.json({ error: "Không kết nối được tới máy chủ. Vui lòng thử lại." }, { status: 502 });
  }
}
