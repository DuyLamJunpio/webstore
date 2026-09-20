import Link from "next/link";
import { ArrowUpRight } from "./icons";

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
  align = "between",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
  align?: "between" | "center";
}) {
  if (align === "center") {
    return (
      <div className="flex flex-col items-center text-center">
        {eyebrow && (
          <span className="mb-2 inline-block bg-[#8f633e] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
            {eyebrow}
          </span>
        )}
        <h2 className="max-w-3xl font-sans text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold leading-[1.1] tracking-[-0.01em] uppercase text-ink">
          {title}
        </h2>
        {subtitle && <p className="mt-3 max-w-xl text-sm sm:text-[15px] leading-relaxed text-[#666666]">{subtitle}</p>}
        {action && (
          <Link
            href={action.href}
            className="mt-6 inline-flex h-10 items-center gap-2 border border-black px-6 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-black hover:text-white"
          >
            <span>{action.label}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
      <div>
        {eyebrow && (
          <span className="mb-2 inline-block bg-[#8f633e] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
            {eyebrow}
          </span>
        )}
        <h2 className="max-w-2xl font-sans text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold leading-[1.1] tracking-[-0.01em] uppercase text-ink">
          {title}
        </h2>
        {subtitle && <p className="mt-2 max-w-lg text-sm sm:text-[15px] leading-relaxed text-[#666666]">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex h-9 items-center gap-2 border border-black bg-white px-5 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-black hover:text-white"
        >
          <span>{action.label}</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
