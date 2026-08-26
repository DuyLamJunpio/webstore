import Link from "next/link";
import { getCatalogue } from "@/lib/catalogue";
import { coverOf, formatPrice, type Product } from "@/lib/data";
import MediaFrame, { PlayBadge } from "./MediaFrame";
import { ArrowUpRight, Bag, Return, Shield } from "./icons";

const SHOPEE_URL = "https://s.shopee.vn/50YFikittI";
const SHOPEE_ORANGE = "#ee4d2d";

const perks = [
  { Icon: Shield, text: "Thanh toán qua ví và cổng thanh toán của Shopee" },
  { Icon: Return, text: "Đổi trả theo chính sách bảo vệ người mua của sàn" },
  { Icon: Bag, text: "Theo dõi đơn ngay trong ứng dụng Shopee" },
];

export default async function ShopeeStore({ products: initialProducts }: { products?: Product[] }) {
  const catalogue = initialProducts ? null : await getCatalogue();
  const products = initialProducts ?? (catalogue?.newArrivals && catalogue.newArrivals.length > 0 ? catalogue.newArrivals : catalogue?.products ?? []);

  const item1 = products[0];
  const item2 = products[1] || products[0];

  const cover1 = item1 ? coverOf(item1)[0] : null;
  const cover2 = item2 ? coverOf(item2)[0] : null;

  return (
    <section id="shopee" className="shell section">
      <div className="overflow-hidden rounded-block bg-cream-dark">
        <div className="grid items-center gap-10 px-6 py-12 sm:px-10 md:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 xl:px-16">
          {/* ── Lời mời ────────────────────────────────────────────── */}
          <div>
            <span
              className="eyebrow inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] text-cream"
              style={{ backgroundColor: SHOPEE_ORANGE }}
            >
              <Bag className="h-3.5 w-3.5" />
              Gian hàng chính thức
            </span>

            <h2 className="mt-5 font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.015em] text-ink">
              Chúng tôi cũng có mặt trên Shopee
            </h2>

            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
              Quen đặt hàng bằng tài khoản Shopee hơn? Ghé gian hàng của The Basic Concept trên
              sàn — vẫn là những thiết kế bạn đang xem ở đây, chỉ khác chỗ bấm nút mua.
            </p>

            <ul className="mt-8 flex flex-col gap-3.5">
              {perks.map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-[15px] text-ink/90">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-gold shadow-2xs">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a
                href={SHOPEE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-medium text-cream shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: SHOPEE_ORANGE }}
              >
                Ghé gian hàng Shopee
                <ArrowUpRight />
              </a>
              <span className="text-[13px] text-muted">Mở tab mới · s.shopee.vn</span>
            </div>
          </div>

          {/* ── 2 sản phẩm mới nhất xếp lớp ── */}
          <div className="relative mx-auto w-full max-w-md lg:mx-0">
            {item1 && cover1 ? (
              <Link
                href={`/products/${item1.slug}`}
                className="group relative block aspect-[4/5] w-[78%] overflow-hidden rounded-card bg-surface shadow-2xl ring-1 ring-line/80 transition-transform duration-300 hover:scale-[1.02]"
              >
                <MediaFrame
                  media={cover1}
                  alt={item1.name}
                  sizes="(max-width: 1024px) 60vw, 360px"
                  className="transition-transform duration-700 group-hover:scale-105"
                />
                {cover1.type === "video" && (
                  <PlayBadge className="absolute bottom-3 left-3 h-8 w-8" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent p-4 text-cream">
                  <span className="eyebrow text-gold text-[10px] font-bold block">{item1.category}</span>
                  <p className="font-medium text-sm text-cream line-clamp-1 group-hover:underline">{item1.name}</p>
                  <p className="text-xs font-semibold text-cream/90 mt-0.5">{formatPrice(item1.price)}</p>
                </div>
              </Link>
            ) : (
              <div className="relative aspect-[4/5] w-[78%] overflow-hidden rounded-card bg-surface shadow-2xl" />
            )}

            {item2 && cover2 ? (
              <Link
                href={`/products/${item2.slug}`}
                className="group absolute bottom-0 right-0 block aspect-[3/4] w-[52%] overflow-hidden rounded-card bg-surface ring-8 ring-cream-dark shadow-2xl transition-transform duration-300 hover:scale-[1.03]"
              >
                <MediaFrame
                  media={cover2}
                  alt={item2.name}
                  sizes="(max-width: 1024px) 40vw, 240px"
                  className="transition-transform duration-700 group-hover:scale-105"
                />
                {cover2.type === "video" && (
                  <PlayBadge className="absolute bottom-2.5 left-2.5 h-6 w-6" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent p-3 text-cream">
                  <p className="font-medium text-xs text-cream truncate group-hover:underline">{item2.name}</p>
                  <p className="text-[11px] font-semibold text-gold mt-0.5">{formatPrice(item2.price)}</p>
                </div>
              </Link>
            ) : null}

            <a
              href={SHOPEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ghé gian hàng Shopee"
              className="absolute -right-1 top-6 grid h-14 w-14 place-items-center rounded-full text-cream shadow-lg transition-transform hover:scale-110 active:scale-95"
              style={{ backgroundColor: SHOPEE_ORANGE }}
            >
              <Bag className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
