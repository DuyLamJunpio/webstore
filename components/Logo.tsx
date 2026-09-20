/**
 * Logo The Basic Concept theo concept UNIQLO:
 * 2 ô vuông đỏ kinh điển (Twin Red Squares) kết hợp chữ in hoa đậm nét và nhãn LifeWear.
 * - "monogram"  → 2 ô vuông đỏ kép cạnh nhau
 * - "inline"    → 2 ô vuông đỏ + tên thương hiệu & LifeWear trên một hàng (header)
 * - "stacked"   → 2 ô vuông đỏ lớn + tên thương hiệu + triết lý LifeWear (footer)
 */
type Variant = "monogram" | "inline" | "stacked";

function TwinRedSquares({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const boxClass =
    size === "lg"
      ? "h-11 w-11 text-[11px] tracking-tighter"
      : size === "sm"
      ? "h-7 w-7 text-[7px] tracking-tighter"
      : "h-9 w-9 text-[9px] tracking-tighter";

  return (
    <div className="flex items-center gap-1 select-none" aria-hidden>
      {/* Ô vuông đỏ 1: THE BASIC */}
      <div
        className={`${boxClass} flex flex-col items-center justify-center bg-[#e60012] font-sans font-black leading-[1.05] text-white shadow-xs`}
      >
        <span className="scale-x-90 font-extrabold uppercase">THE</span>
        <span className="scale-x-90 font-extrabold uppercase">BASIC</span>
      </div>

      {/* Ô vuông đỏ 2: CONCEPT */}
      <div
        className={`${boxClass} flex flex-col items-center justify-center bg-[#e60012] font-sans font-black leading-[1.05] text-white shadow-xs`}
      >
        <span className="scale-x-90 font-extrabold uppercase">CON</span>
        <span className="scale-x-90 font-extrabold uppercase">CEPT</span>
      </div>
    </div>
  );
}

export default function Logo({
  variant = "inline",
  align = "center",
  className = "",
  light = false,
}: {
  variant?: Variant;
  align?: "left" | "center";
  className?: string;
  light?: boolean;
}) {
  if (variant === "monogram") {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <TwinRedSquares size="sm" />
        <span className="sr-only">The Basic Concept — trang chủ</span>
      </span>
    );
  }

  if (variant === "stacked") {
    const alignment = align === "left" ? "items-start text-left" : "items-center text-center";
    return (
      <span className={`inline-flex flex-col ${alignment} ${className}`}>
        <TwinRedSquares size="lg" />
        <span className="mt-4 text-[16px] font-bold uppercase tracking-[0.15em] text-current">
          The Basic Concept
        </span>
        <div className="mt-1 flex items-center gap-2">
          <span className="h-0.5 w-4 bg-[#e60012]" />
          <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#e60012]">
            LifeWear
          </span>
        </div>
        <span className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted">
          Đơn giản tạo nên sự hoàn hảo
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <TwinRedSquares size="md" />
      <div className="flex flex-col justify-center">
        <span
          className={`text-[14px] font-bold uppercase leading-none tracking-[0.1em] transition-colors sm:text-[15px] ${
            light ? "text-white" : "text-ink"
          }`}
        >
          The Basic Concept
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e60012]">
          LifeWear
        </span>
      </div>
    </span>
  );
}
