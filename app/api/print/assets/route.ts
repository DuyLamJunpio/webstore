/**
 * POST /api/print/assets — nhận file thiết kế của khách rồi đẩy sang kho ảnh.
 *
 * Trình duyệt KHÔNG gọi thẳng trang quản trị: endpoint bên đó nằm sau bí mật
 * dùng chung, mà bí mật thì không được phép có mặt trong mã chạy ở máy khách.
 * Chặng này là chỗ duy nhất biết bí mật đó.
 *
 * File đi tiếp lên Supabase từ phía Laravel — nơi khoá Supabase vốn đã nằm sẵn,
 * nên toàn hệ thống chỉ có một chỗ giữ khoá kho ảnh.
 */

import type { NextRequest } from "next/server";

const BASE = (process.env.WAREHOUSE_API_URL ?? "").replace(/\/$/, "");
const SECRET = process.env.WAREHOUSE_WEBHOOK_SECRET ?? "";

/** Trần dung lượng, khớp với luật `max:25600` (KB) bên trang quản trị. */
const MAX_BYTES = 25 * 1024 * 1024;

const TIMEOUT_MS = 60_000;

export async function POST(request: NextRequest) {
  if (!BASE || !SECRET) {
    console.error("[in-ao] thiếu WAREHOUSE_API_URL hoặc WAREHOUSE_WEBHOOK_SECRET");
    return Response.json({ error: "Chức năng tải file đang tạm ngưng. Vui lòng liên hệ shop." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Không đọc được file gửi lên." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Chưa chọn file thiết kế." }, { status: 400 });
  }

  // Chặn ngay tại đây thay vì để Laravel từ chối sau khi đã tải hết lên: khách
  // dùng mạng di động sẽ chờ hết cả phút rồi mới biết file quá nặng.
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: `File nặng ${(file.size / 1024 / 1024).toFixed(1)} MB, vượt mức 25 MB.` },
      { status: 413 },
    );
  }

  const forwarded = new FormData();
  forwarded.append("file", file, file.name);
  const name = form.get("name");
  if (typeof name === "string" && name.trim()) forwarded.append("name", name.trim());

  try {
    const response = await fetch(`${BASE}/api/storefront/print/assets`, {
      method: "POST",
      headers: { Accept: "application/json", "X-Storefront-Secret": SECRET },
      body: forwarded,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return Response.json(
        { error: data?.error ?? "Không lưu được file. Vui lòng thử lại." },
        { status: response.status },
      );
    }

    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error("[in-ao] không đẩy được file sang trang quản trị", error);
    return Response.json({ error: "Không kết nối được tới máy chủ. Vui lòng thử lại." }, { status: 502 });
  }
}
