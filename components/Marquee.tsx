import { Diamond } from "./icons";

const words = ["Đơn giản", "Hằng ngày", "Cho mọi người"];

function Track() {
  return (
    <div className="flex shrink-0 items-center">
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className="flex shrink-0 items-center gap-6 pr-6 sm:gap-10 sm:pr-10">
          <span className="whitespace-nowrap font-serif text-[clamp(1.75rem,3.8vw,3.25rem)] font-medium tracking-[-0.01em] text-cream">
            {words[i % words.length]}
          </span>
          <Diamond className="h-2.5 w-2.5 shrink-0 text-gold sm:h-3 sm:w-3" />
        </span>
      ))}
    </div>
  );
}

export default function Marquee() {
  return (
    <section aria-hidden className="overflow-hidden bg-ink py-7 sm:py-9">
      <div className="marquee marquee-slow">
        <Track />
        <Track />
      </div>
    </section>
  );
}
