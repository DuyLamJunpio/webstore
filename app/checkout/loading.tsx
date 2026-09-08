export default function CheckoutLoading() {
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

      <div className="mt-4 h-10 sm:h-12 w-72 max-w-full rounded-lg bg-line-strong/40" />

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Form Skeleton */}
        <section className="space-y-6">
          <div className="h-4 w-40 rounded bg-line-strong/30" />
          <div className="grid gap-5 sm:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 rounded bg-line-strong/30" />
                <div className="h-12 w-full rounded-card bg-line-strong/20" />
              </div>
            ))}
          </div>
        </section>

        {/* Summary Skeleton */}
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
