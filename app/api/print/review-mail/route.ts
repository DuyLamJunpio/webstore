/**
 * POST /api/print/review-mail — trang quản trị báo một mẫu in vừa được quyết.
 *
 * Thư đi từ đây chứ không từ Laravel vì mọi thứ cần để gửi đều đã ở đây: tài
 * khoản SMTP và mẫu thư theo nhận diện của shop. Bên kho chỉ cần nói "mẫu này
 * vừa được duyệt / bị từ chối, vì lý do kia".
 *
 * Không tin gì từ thân request: thiếu hoặc sai thì thay bằng giá trị an toàn.
 * Một lá thư hiện "NaN đồng" còn tệ hơn một lá thư thiếu số.
 */

import { isReviewDecision, sendPrintReviewMail } from "@/lib/print-review-email";
import { isEmailConfigured } from "@/lib/email";
import { rejectUnlessWarehouse } from "@/lib/warehouse-auth";

const text = (value: unknown, max = 255): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const money = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
};

export async function POST(request: Request) {
  const rejected = rejectUnlessWarehouse(request, "print-review-mail");
  if (rejected) return rejected;

  if (!isEmailConfigured()) {
    // 200 chứ không phải lỗi: quyết định duyệt bên kia đã lưu xong và đúng.
    // Trả lỗi ở đây chỉ khiến trang quản trị hiện một cảnh báo sai chỗ.
    console.warn("[in-ao] chưa cấu hình SMTP nên không gửi được thư duyệt thiết kế");
    return Response.json({ sent: false, reason: "email-not-configured" });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });

  const decision = body.decision;
  if (!isReviewDecision(decision)) {
    return Response.json({ error: "Quyết định không hợp lệ." }, { status: 400 });
  }

  const customerEmail = text(body.customer_email, 120);
  if (!customerEmail) {
    return Response.json({ sent: false, reason: "no-recipient" });
  }

  try {
    await sendPrintReviewMail({
      designCode: text(body.design_code, 24) || "—",
      decision,
      note: text(body.note, 500),
      customerName: text(body.customer_name, 120),
      customerEmail,
      orderCode: text(body.order_code, 40),
      blankName: text(body.blank_name, 150),
      techniqueName: text(body.technique_name, 120),
      colorName: text(body.color_name, 80),
      size: text(body.size, 40),
      qty: Math.max(1, money(body.qty)),
      totalPrice: money(body.total_price),
      paid: body.paid === true,
      refundBankName: text(body.refund_bank_name, 100),
      refundAccountNumber: text(body.refund_account_number, 40),
      refundAccountName: text(body.refund_account_name, 120),
    });

    return Response.json({ sent: true });
  } catch (error) {
    console.error("[in-ao] không gửi được thư duyệt thiết kế", error);
    return Response.json({ error: "Không gửi được thư." }, { status: 502 });
  }
}
