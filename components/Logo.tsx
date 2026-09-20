import Image from "next/image";

type Variant = "monogram" | "inline" | "stacked";

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
        <span className="relative block h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-xs border border-[#8f633e]/20 bg-[#f4efe9] shadow-xs shrink-0">
          <Image
            src="/logo.jpg"
            alt="The Basic Concept"
            fill
            sizes="40px"
            className="object-cover"
          />
        </span>
        <span className="sr-only">The Basic Concept — trang chủ</span>
      </span>
    );
  }

  if (variant === "stacked") {
    const alignment = align === "left" ? "items-start text-left" : "items-center text-center";
    return (
      <span className={`inline-flex flex-col ${alignment} ${className}`}>
        <span className="relative block h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-xs border border-[#8f633e]/25 bg-[#f4efe9] shadow-xs shrink-0">
          <Image
            src="/logo.jpg"
            alt="The Basic Concept"
            fill
            sizes="96px"
            className="object-cover"
          />
        </span>
        <span className="mt-3.5 text-[15px] sm:text-[16px] font-bold uppercase tracking-[0.16em] text-current">
          The Basic Concept
        </span>
        <div className="mt-1 flex items-center gap-2">
          <span className="h-0.5 w-4 bg-[#8f633e]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f633e]">
            Simple · Everyday · For Everyone
          </span>
        </div>
        <span className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-muted">
          Đơn giản tạo nên sự hoàn hảo
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 sm:gap-3.5 ${className}`}>
      <span className="relative block h-10 w-10 sm:h-11 sm:w-11 overflow-hidden rounded-xs border border-[#8f633e]/25 bg-[#f4efe9] shadow-xs shrink-0">
        <Image
          src="/logo.jpg"
          alt="The Basic Concept"
          fill
          sizes="44px"
          className="object-cover"
          priority
        />
      </span>
      <div className="flex flex-col justify-center">
        <span
          className={`text-[13px] sm:text-[15px] font-bold uppercase leading-none tracking-[0.12em] transition-colors ${
            light ? "text-white" : "text-ink"
          }`}
        >
          The Basic Concept
        </span>
        <span
          className={`mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] ${
            light ? "text-white/80" : "text-[#8f633e]"
          }`}
        >
          Simple · Everyday · Everyone
        </span>
      </div>
    </span>
  );
}
