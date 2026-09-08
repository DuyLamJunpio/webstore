import { Spinner } from "@/components/icons";

export default function OrderLoading() {
  return (
    <div className="shell pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-24 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 text-[13px] text-muted">
        <div className="h-4 w-16 rounded bg-line-strong/30" />
        <span>/</span>
        <div className="h-4 w-16 rounded bg-line-strong/30" />
        <span>/</span>
        <div className="h-4 w-24 rounded bg-line-strong/40" />
      </div>

      {/* Header Skeleton */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="h-10 sm:h-12 w-64 max-w-full rounded-lg bg-line-strong/40" />
        <div className="h-5 w-44 rounded bg-line-strong/20" />
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Main Content Skeleton */}
        <section className="space-y-6">
          {/* Status Bar Skeleton */}
          <div className="flex items-center justify-between rounded-card bg-cream p-4 border border-line">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-gold animate-ping" />
              <div className="h-4 w-48 rounded bg-line-strong/30" />
            </div>
            <div className="h-4 w-24 rounded bg-line-strong/30" />
          </div>

          {/* QR & Bank Details Box Skeleton */}
          <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
            {/* QR box */}
            <div className="rounded-block border border-line bg-surface p-5 flex flex-col items-center justify-center">
              <div className="relative aspect-square w-[min(72vw,240px)] overflow-hidden rounded-card bg-cream flex flex-col items-center justify-center border border-line">
                <Spinner className="h-8 w-8 text-gold" />
                <p className="mt-2 text-xs font-medium text-muted">Đang tải mã QR…</p>
              </div>
              <div className="mt-4 h-7 w-32 rounded bg-line-strong/30" />
              <div className="mt-1.5 h-4 w-48 rounded bg-line-strong/20" />
            </div>

            {/* Bank details list */}
            <div className="rounded-block border border-line bg-surface p-5 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border-b border-line/60 pb-3 last:border-0 last:pb-0">
                  <div className="h-3 w-20 rounded bg-line-strong/25" />
                  <div className="mt-1.5 h-5 w-48 rounded bg-line-strong/40" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Aside Summary Skeleton */}
        <aside className="lg:sticky lg:top-[92px] lg:self-start">
          <div className="rounded-block border border-line bg-surface p-6 space-y-5">
            <div className="h-4 w-32 rounded bg-line-strong/30" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-14 w-14 rounded-card bg-line-strong/30 shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-3/4 rounded bg-line-strong/30" />
                    <div className="h-3 w-1/2 rounded bg-line-strong/20" />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-line pt-4 space-y-2">
              <div className="h-4 w-full rounded bg-line-strong/20" />
              <div className="h-4 w-full rounded bg-line-strong/20" />
              <div className="h-6 w-full rounded bg-line-strong/40" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
