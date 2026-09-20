/**
 * GET /api/orders/[ref] — what the payment page polls while the shopper pays.
 *
 * SePay updates the stored order through its webhook. This endpoint only lets
 * the page observe that state without exposing customer details.
 *
 * Only the payment status is returned, never the customer's details — `ref` is
 * unguessable but it still travels in a URL.
 */

import type { NextRequest } from "next/server";
import { syncOrderStatus } from "@/lib/order-status";
import { getOrder } from "@/lib/orders";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/orders/[ref]">) {
  const { ref } = await ctx.params;

  const stored = await getOrder(ref);
  if (!stored) return Response.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });

  const order = await syncOrderStatus(stored);

  return Response.json(
    {
      ref: order.ref,
      status: order.status,
      paidAt: order.paidAt ?? null,
      expiresAt: order.expiresAt,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
