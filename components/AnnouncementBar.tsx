import { Diamond } from "./icons";

const items = ["Ưu đãi mùa mới", "Giảm đến 30%", "Miễn phí giao hàng từ 500.000 ₫"];

function Track() {
  return (
    <div className="flex shrink-0 items-center">
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className="flex shrink-0 items-center gap-8 pr-8">
          <span className="eyebrow whitespace-nowrap text-cream/90">{items[i % items.length]}</span>
          <Diamond className="h-1.5 w-1.5 text-gold" />
        </span>
      ))}
    </div>
  );
}

export default function AnnouncementBar() {
  return (
    <div className="overflow-hidden bg-ink py-[9px]">
      <div className="marquee">
        <Track />
        <Track />
      </div>
    </div>
  );
}
