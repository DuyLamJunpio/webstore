"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One line of bank-transfer detail with a copy button.
 *
 * Typing an account number by hand is where transfers go wrong, so the copied
 * value is always the machine-readable one — digits only for an amount, the
 * exact memo for the reference — while the label beside it stays readable.
 */
export default function CopyField({
  label,
  value,
  display,
  hint,
  emphasis,
}: {
  label: string;
  /** what lands on the clipboard */
  value: string;
  /** what the shopper reads, when that differs */
  display?: string;
  hint?: string;
  emphasis?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // http on a LAN address has no clipboard API — leave the value selectable
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-none">
      <div className="min-w-0">
        <p className="text-[12px] text-muted">{label}</p>
        <p className={`mt-0.5 break-words ${emphasis ? "text-lg font-medium" : "text-[15px]"}`}>
          {display ?? value}
        </p>
        {hint && <p className="mt-0.5 text-[12px] text-muted">{hint}</p>}
      </div>

      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-full border border-line-strong px-3 py-1.5 text-[12px] font-medium transition-colors hover:border-ink"
      >
        {copied ? "Đã chép" : "Sao chép"}
      </button>
    </div>
  );
}
