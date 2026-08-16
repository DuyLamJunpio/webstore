import Image from "next/image";
import { ArrowUpRight, Bag, Return, Shield } from "./icons";

/**
 * Khối giới thiệu gian hàng Shopee trên trang chủ.
 *
 * Để hằng số ngay tại đây thay vì `lib/data.ts`: file đó đã chạm ngưỡng độ dài
 * cho phép, và đường dẫn này chỉ dùng ở đúng một chỗ. Khi nào thêm link Shopee
 * vào footer hay header thì hẵng tách ra dùng chung.
 */
const SHOPEE_URL = "https://s.shopee.vn/50YFikittI";

/** cam thương hiệu Shopee — chỉ dùng cho nút và nhãn, không lan ra phần còn lại */
const SHOPEE_ORANGE = "#ee4d2d";

/**
 * Lợi ích của việc mua qua sàn, không phải lời hứa của riêng shop.
 * Cố ý không nêu số đánh giá hay khuyến mãi: những thứ đó thay đổi theo từng
 * đợt, viết cứng vào đây là sớm muộn cũng thành thông tin sai.
 */
const perks = [
  { Icon: Shield, text: "Thanh toán qua ví và cổng thanh toán của Shopee" },
  { Icon: Return, text: "Đổi trả theo chính sách bảo vệ người mua của sàn" },
  { Icon: Bag, text: "Theo dõi đơn ngay trong ứng dụng Shopee" },
];

export default function ShopeeStore() {
  return (
    <section id="shopee" className="shell section">
      <div className="overflow-hidden rounded-block bg-cream-dark">
        <div className="grid items-center gap-10 px-6 py-12 sm:px-10 md:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 xl:px-16">
          {/* ── lời mời ────────────────────────────────────────────── */}
          <div>
            <span
              className="eyebrow inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] text-cream"
              style={{ backgroundColor: SHOPEE_ORANGE }}
            >
              <Bag className="h-3.5 w-3.5" />
              Gian hàng chính thức
            </span>

            <h2 className="mt-5 font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.015em]">
              Chúng tôi cũng có mặt trên Shopee
            </h2>

            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
              Quen đặt hàng bằng tài khoản Shopee hơn? Ghé gian hàng của The Basic Concept trên
              sàn — vẫn là những thiết kế bạn đang xem ở đây, chỉ khác chỗ bấm nút mua.
            </p>

            <ul className="mt-8 flex flex-col gap-3.5">
              {perks.map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-[15px]">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-gold">
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
                className="inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-medium text-cream transition-transform duration-300 hover:-translate-y-0.5"
                style={{ backgroundColor: SHOPEE_ORANGE }}
              >
                Ghé gian hàng Shopee
                <ArrowUpRight />
              </a>
              <span className="text-[13px] text-muted">Mở tab mới · s.shopee.vn</span>
            </div>
          </div>

          {/* ── ảnh xếp lớp cho có chiều sâu, không phải hai ô phẳng ── */}
          <div className="relative mx-auto w-full max-w-md lg:mx-0">
            <div className="relative aspect-[4/5] w-[78%] overflow-hidden rounded-card bg-surface shadow-2xl">
              <Image
                src="/images/p-everyday-hoodie-1.png"
                alt="Áo hoodie của The Basic Concept bán trên Shopee"
                fill
                sizes="(max-width: 1024px) 60vw, 300px"
                className="object-cover"
              />
            </div>

            <div className="absolute bottom-0 right-0 aspect-[3/4] w-[52%] overflow-hidden rounded-card bg-surface ring-8 ring-cream-dark">
              <Image
                src="/images/p-cardigan-1.png"
                alt="Áo cardigan của The Basic Concept bán trên Shopee"
                fill
                sizes="(max-width: 1024px) 40vw, 200px"
                className="object-cover"
              />
            </div>

            <span
              aria-hidden
              className="absolute -right-1 top-6 grid h-14 w-14 place-items-center rounded-full text-cream shadow-lg"
              style={{ backgroundColor: SHOPEE_ORANGE }}
            >
              <Bag className="h-6 w-6" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
