import { getWarehouseVouchers, validateWarehouseVoucher } from "@/lib/warehouse-vouchers";

export async function GET() {
  return Response.json({ vouchers: await getWarehouseVouchers() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: unknown; subtotal?: unknown; shipping?: unknown } | null;
  if (!body || typeof body.code !== "string" || typeof body.subtotal !== "number" || !Number.isFinite(body.subtotal) || body.subtotal < 0
    || typeof body.shipping !== "number" || !Number.isFinite(body.shipping) || body.shipping < 0) {
    return Response.json({ error: "Dữ liệu kiểm tra voucher không hợp lệ." }, { status: 400 });
  }

  const result = await validateWarehouseVoucher(body.code, body.subtotal, body.shipping);
  if (!result.ok) return Response.json({ error: result.error }, { status: 422 });
  return Response.json({ voucher: result.quote.voucher, discount: result.quote.discount, newShipping: result.quote.newShipping, message: result.quote.message });
}
