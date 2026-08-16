/**
 * Logo The Basic Concept, dựng bằng chữ để luôn sắc nét ở mọi kích thước.
 * - "monogram"  → chỉ ba chữ TBC lồng nhau (chỗ hẹp, favicon, thanh mobile)
 * - "inline"    → monogram + tên thương hiệu trên một dòng (header)
 * - "stacked"   → khối đầy đủ có gạch ngang + khẩu hiệu (footer, chỗ cỡ lớn)
 */
type Variant = "monogram" | "inline" | "stacked";

function Monogram({ className = "text-[34px]" }: { className?: string }) {
  return (
    <span
      className={`gold-text font-serif leading-none ${className}`}
      style={{ fontWeight: 500 }}
      aria-hidden
    >
      <span>T</span>
      <span className="-ml-[0.30em]">B</span>
      <span className="-ml-[0.26em]">C</span>
    </span>
  );
}

export default function Logo({
  variant = "inline",
  align = "center",
  className = "",
}: {
  variant?: Variant;
  /** chỉ dùng cho biến thể xếp chồng */
  align?: "left" | "center";
  className?: string;
}) {
  if (variant === "monogram") {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <Monogram />
        <span className="sr-only">The Basic Concept — trang chủ</span>
      </span>
    );
  }

  if (variant === "stacked") {
    const alignment = align === "left" ? "items-start text-left" : "items-center text-center";
    return (
      <span className={`inline-flex flex-col ${alignment} ${className}`}>
        <Monogram className="text-[56px]" />
        <span className="mt-5 text-[15px] font-medium uppercase tracking-[0.34em]">
          The Basic Concept
        </span>
        <span className="my-4 h-px w-16 bg-current opacity-30" />
        <span className="text-[10px] uppercase tracking-[0.3em] opacity-70">
          Đơn giản. Hằng ngày. Cho tất cả.
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Monogram className="text-[30px]" />
      <span className="hidden text-[12px] font-medium uppercase leading-none tracking-[0.28em] sm:inline">
        The Basic Concept
      </span>
      <span className="sr-only sm:hidden">The Basic Concept</span>
    </span>
  );
}
