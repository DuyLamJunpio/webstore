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
      <div className="border border-line bg-[#f7f7f7] p-6 sm:p-10 lg:p-14">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* ── Lời mời ────────────────────────────────────────────── */}
          <div>
            <span
              className="inline-flex items-center gap-2 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-2xs"
              style={{ backgroundColor: SHOPEE_ORANGE }}
            >
              <Bag className="h-3.5 w-3.5" />
              GIAN HÀNG SHOPEE MALL
            </span>

            <h2 className="mt-4 font-sans text-[clamp(1.75rem,3.4vw,2.75rem)] font-extrabold uppercase leading-[1.1] tracking-[-0.01em] text-ink">
              Gian hàng chính thức trên Shopee
            </h2>

            <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#555555]">
              Quen đặt hàng bằng tài khoản Shopee hơn? Ghé gian hàng của The Basic Concept trên
              sàn — sản phẩm chính hãng, bảo vệ quyền lợi người mua và giao nhanh toàn quốc.
            </p>

            <ul className="mt-6 flex flex-col gap-3">
              {perks.map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-xs sm:text-sm text-ink/90">
                  <span className="grid h-8 w-8 shrink-0 place-items-center bg-white border border-line text-[#8f633e]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a
                href={SHOPEE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 px-7 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-opacity hover:opacity-90 active:scale-98"
                style={{ backgroundColor: SHOPEE_ORANGE }}
              >
                <span>GHÉ GIAN HÀNG SHOPEE</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <span className="text-xs text-muted">Mở tab mới · s.shopee.vn</span>
            </div>
          </div>

          {/* ── 2 sản phẩm mới nhất xếp lớp ── */}
          <div className="relative mx-auto w-full max-w-md lg:mx-0">
            {item1 && cover1 ? (
              <Link
                href={`/products/${item1.slug}`}
                className="group relative block aspect-[4/5] w-[80%] overflow-hidden border border-line bg-white shadow-md transition-transform duration-300 hover:scale-[1.02]"
              >
                <MediaFrame
                  media={cover1}
                  alt={item1.name}
                  sizes="(max-width: 1024px) 60vw, 360px"
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                {cover1.type === "video" && (
                  <PlayBadge className="absolute bottom-3 left-3 h-8 w-8" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff4d4f] block">{item1.category}</span>
                  <p className="font-bold text-xs sm:text-sm text-white line-clamp-1 group-hover:underline">{item1.name}</p>
                  <p className="text-xs font-bold text-white mt-0.5">{formatPrice(item1.price)}</p>
                </div>
              </Link>
            ) : (
              <div className="relative aspect-[4/5] w-[80%] overflow-hidden bg-white border border-line shadow-md" />
            )}

            {item2 && cover2 ? (
              <Link
                href={`/products/${item2.slug}`}
                className="group absolute bottom-0 right-0 block aspect-[3/4] w-[54%] overflow-hidden border-4 border-[#f7f7f7] bg-white shadow-lg transition-transform duration-300 hover:scale-[1.03]"
              >
                <MediaFrame
                  media={cover2}
                  alt={item2.name}
                  sizes="(max-width: 1024px) 40vw, 240px"
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                {cover2.type === "video" && (
                  <PlayBadge className="absolute bottom-2 left-2 h-6 w-6" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 text-white">
                  <p className="font-bold text-xs text-white truncate group-hover:underline">{item2.name}</p>
                  <p className="text-[11px] font-bold text-[#ff4d4f] mt-0.5">{formatPrice(item2.price)}</p>
                </div>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
