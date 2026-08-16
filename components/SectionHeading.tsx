import Link from "next/link";
import { ArrowUpRight } from "./icons";

export default function SectionHeading({
  title,
  subtitle,
  action,
  align = "between",
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
  align?: "between" | "center";
}) {
  if (align === "center") {
    return (
      <div className="flex flex-col items-center text-center">
        <h2 className="max-w-3xl font-serif text-[clamp(2.25rem,4vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.015em]">
          {title}
        </h2>
        {subtitle && <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">{subtitle}</p>}
        {action && (
          <Link
            href={action.href}
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-full border border-line-strong px-6 text-sm font-medium transition-colors hover:border-ink hover:bg-ink hover:text-cream"
          >
            {action.label}
            <ArrowUpRight />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <h2 className="max-w-2xl font-serif text-[clamp(2.25rem,4vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.015em]">
          {title}
        </h2>
        {subtitle && <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong px-6 text-sm font-medium transition-colors hover:border-ink hover:bg-ink hover:text-cream"
        >
          {action.label}
          <ArrowUpRight />
        </Link>
      )}
    </div>
  );
}
