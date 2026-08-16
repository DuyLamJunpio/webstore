"use client";

export default function QuantityStepper({
  value,
  onChange,
  max,
  min = 1,
  label = "Số lượng",
  size = "md",
}: {
  value: number;
  onChange: (next: number) => void;
  max: number;
  min?: number;
  label?: string;
  size?: "sm" | "md";
}) {
  const dimensions = size === "sm" ? "h-9 w-9 text-sm" : "h-11 w-11 text-base";

  return (
    <div
      className="inline-flex items-center rounded-full border border-line-strong"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Giảm số lượng"
        className={`grid ${dimensions} place-items-center rounded-full transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-35`}
      >
        −
      </button>
      <span aria-live="polite" className={`min-w-8 text-center ${size === "sm" ? "text-sm" : ""}`}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Tăng số lượng"
        className={`grid ${dimensions} place-items-center rounded-full transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-35`}
      >
        +
      </button>
    </div>
  );
}
