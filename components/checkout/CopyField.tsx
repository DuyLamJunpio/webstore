"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "../icons";

export default function CopyField({
  label,
  value,
  display,
  hint,
  emphasis,
}: {
  label: string;
  value: string;
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
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-none">
      <div className="min-w-0">
        <p className="text-xs text-muted font-medium">{label}</p>
        <p className={`mt-0.5 break-words font-semibold text-ink ${emphasis ? "text-base sm:text-lg text-gold-deep" : "text-sm sm:text-[15px]"}`}>
          {display ?? value}
        </p>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>

      <button
        type="button"
        onClick={copy}
        aria-label={`Sao chép ${label}`}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
          copied
            ? "bg-[#15803d] text-white shadow-xs scale-105"
            : "border border-line-strong bg-surface text-ink hover:border-ink active:scale-95"
        }`}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            <span>Đã chép</span>
          </>
        ) : (
          <span>Sao chép</span>
        )}
      </button>
    </div>
  );
}

