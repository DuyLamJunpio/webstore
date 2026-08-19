/**
 * Cửa vào cho những endpoint mà trang quản trị gọi sang.
 *
 * Chặng server-to-server nên bí mật dùng chung là đủ — cùng giá trị với
 * `WAREHOUSE_WEBHOOK_SECRET` mà web dùng khi báo đã thanh toán, chỉ đổi chiều.
 *
 * Để riêng một chỗ vì đã có hai endpoint cần nó (làm mới catalogue, gửi thư đổi
 * trạng thái), và một bản sao thứ hai của phép so sánh này là một bản sao có thể
 * bị sửa sai mà không ai để ý.
 */

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

/**
 * Trả về `Response` cần gửi lại khi không hợp lệ, `null` khi được đi tiếp.
 *
 * `tag` chỉ dùng cho log, để đọc log biết endpoint nào đang bị gọi hụt.
 */
export function rejectUnlessWarehouse(request: Request, tag: string): Response | null {
  // Chưa cấu hình thì chặn hết, không im lặng cho qua: để ngỏ là ai cũng gọi được.
  if (!SECRET) {
    console.error(`[${tag}] thiếu WAREHOUSE_WEBHOOK_SECRET — đã từ chối yêu cầu`);
    return Response.json({ error: "Chưa cấu hình xác thực." }, { status: 503 });
  }

  const provided = request.headers.get("x-warehouse-secret") ?? "";
  if (!matches(provided, SECRET)) {
    console.warn(`[${tag}] từ chối yêu cầu thiếu hoặc sai bí mật trang quản trị`);
    return Response.json({ error: "Không có quyền." }, { status: 401 });
  }

  return null;
}
