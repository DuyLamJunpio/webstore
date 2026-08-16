"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const POLL_MS = 4000;

/**
 * Watches an order while the shopper is in their banking app.
 *
 * PayOS's webhook is the fast path, but it needs a public URL — on a laptop
 * behind NAT it never arrives, so this asks the server every few seconds
 * instead. The server is the one that talks to PayOS; this only knows how to
 * ask, and how to refresh the page once the answer changes.
 */
/** statuses that will never change again — polling past them is pure waste */
const SETTLED = ["PAID", "CANCELLED", "EXPIRED", "FAILED"];

export default function PaymentWatcher({
  orderRef,
  status,
  expiresAt,
}: {
  orderRef: string;
  /** what the server rendered with, so a change is worth a refresh */
  status: string;
  expiresAt: number;
}) {
  const router = useRouter();
  // null until mounted — the server has no clock the client would agree with
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  useEffect(() => {
    let stopped = false;

    async function poll() {
      try {
        const response = await fetch(`/api/orders/${orderRef}`, { cache: "no-store" });
        if (!response.ok) return;
        const next = ((await response.json()) as { status: string }).status;
        if (stopped || next === status) return;

        // a partial transfer keeps the link open, so only stop on a final answer
        if (SETTLED.includes(next)) stopped = true;
        // re-render from the server; this effect restarts with the new status
        router.refresh();
      } catch {
        // offline, or the tab was frozen mid-request — the next tick tries again
      }
    }

    const id = setInterval(() => {
      if (stopped || Date.now() > expiresAt + POLL_MS) return;
      void poll();
    }, POLL_MS);

    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [orderRef, status, expiresAt, router]);

  const expired = remaining === 0;
  const clock =
    remaining === null
      ? "--:--"
      : `${String(Math.floor(remaining / 60000)).padStart(2, "0")}:${String(
          Math.floor((remaining % 60000) / 1000),
        ).padStart(2, "0")}`;

  return (
    <div
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-cream px-4 py-3 text-[13px]"
    >
      <span className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2" aria-hidden>
          {!expired && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-70" />
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${expired ? "bg-muted" : "bg-gold"}`} />
        </span>
        {expired
          ? "Mã QR đã hết hạn."
          : status === "UNDERPAID"
            ? "Đã nhận một phần — đang chờ phần còn lại."
            : status === "PROCESSING"
              ? "Ngân hàng đang xử lý giao dịch…"
              : "Đang chờ chuyển khoản — trang sẽ tự cập nhật."}
      </span>
      <span className="text-muted">
        {expired ? (
          "Vui lòng tạo đơn mới."
        ) : (
          <>
            Hết hạn sau <span className="font-medium tabular-nums text-ink">{clock}</span>
          </>
        )}
      </span>
    </div>
  );
}
