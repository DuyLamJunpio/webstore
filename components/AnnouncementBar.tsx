import { getContent } from "@/lib/content";

function Track({ items }: { items: string[] }) {
  return (
    <div className="flex shrink-0 items-center">
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className="eyebrow flex shrink-0 items-center gap-3 pr-8 text-cream/80">
          {items[i % items.length]}
          <span aria-hidden className="text-gold">
            •
          </span>
        </span>
      ))}
    </div>
  );
}

/**
 * Dải chữ nhỏ chạy trên cùng. Nằm ở layout nên hiện ở MỌI trang, không riêng
 * trang chủ — sửa nội dung ở trang quản trị, mục Nội dung trang chủ.
 */
export default async function AnnouncementBar() {
  const { announcement } = await getContent();

  if (announcement.length === 0) return null;

  return (
    <div aria-hidden className="overflow-hidden bg-ink py-2">
      <div className="marquee">
        <Track items={announcement} />
        <Track items={announcement} />
      </div>
    </div>
  );
}
