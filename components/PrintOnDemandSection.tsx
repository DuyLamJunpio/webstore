import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/data";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Return,
  Shield,
  Ship,
  Sparkles,
} from "./icons";

export interface FeaturedBlank {
  id?: number | string;
  slug: string;
  name: string;
  categoryName?: string;
  badge?: string;
  price: number;
  /** Giá trước giảm, gạch ngang cạnh `price`; null khi phôi không giảm. */
  comparePrice?: number | null;
  /** Nhãn mức giảm dựng sẵn bên quản trị, ví dụ "−10%". */
  discountLabel?: string | null;
  image: string | null;
  colors: Array<{ name: string; hex: string }>;
  moq?: number;
  leadDays?: number;
}
export interface PrintOnDemandSectionProps {
  /** Phôi đã lọc từ catalogue kho, theo thứ tự quản trị. */
  blanks: FeaturedBlank[];
  /** API kho không phản hồi; khác với trường hợp shop chưa khai phôi. */
  blanksUnavailable?: boolean;
  title?: string;
  subtitle?: string;
}

export default function PrintOnDemandSection({
  blanks,
  blanksUnavailable = false,
  title = "In Thiết Kế Theo Yêu Cầu",
  subtitle = "Tự do sáng tạo chiếc áo mang dấu ấn riêng của bạn. Tải hình vẽ, ảnh chụp, logo hội nhóm hoặc thông điệp độc bản — kéo thả trực quan lên áo, xem trước mô phỏng thực tế và biết giá ngay lập tức từ chỉ 1 chiếc.",
}: PrintOnDemandSectionProps) {
  return (
    <section id="in-thiet-ke" className="shell section">
      <div className="border border-line bg-white shadow-xs">
        {/* ── Phần 1: Banner giới thiệu & Quy trình in ấn ── */}
        <div className="bg-[#f7f7f7] border-b border-line p-6 sm:p-10 md:p-12 lg:p-14">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 items-center">
            {/* Cột trái: Thông điệp & CTA */}
            <div className="lg:col-span-7">
              <span className="inline-block bg-[#8f633e] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-2xs">
                UTme! STUDIO · CÔNG NGHỆ IN SẮC NÉT
              </span>

              <h2 className="mt-3 font-sans text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold uppercase leading-[1.1] tracking-[-0.015em] text-ink">
                {title}
              </h2>

              <p className="mt-3.5 max-w-xl text-sm sm:text-[15px] leading-relaxed text-[#555555]">
                {subtitle}
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                <div className="flex items-start gap-2.5">
                  <span className="grid h-5 w-5 place-items-center bg-[#8f633e] text-white shrink-0 mt-0.5">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase text-ink">In từ chỉ 1 chiếc</p>
                    <p className="text-[11px] text-muted">Không áp đặt số lượng tối thiểu</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="grid h-5 w-5 place-items-center bg-[#8f633e] text-white shrink-0 mt-0.5">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase text-ink">Vải 100% Cotton</p>
                    <p className="text-[11px] text-muted">Phôi chuẩn phom, dày dặn, bền bỉ</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="grid h-5 w-5 place-items-center bg-[#8f633e] text-white shrink-0 mt-0.5">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase text-ink">In Kỹ Thuật Số Sắc Nét</p>
                    <p className="text-[11px] text-muted">Bền màu, không bong tróc khi giặt</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="grid h-5 w-5 place-items-center bg-[#8f633e] text-white shrink-0 mt-0.5">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase text-ink">Báo Giá Trực Tiếp</p>
                    <p className="text-[11px] text-muted">Giá hiện tức thì, minh bạch tuyệt đối</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/in-ao"
                  className="inline-flex h-11 items-center gap-2 bg-[#8f633e] px-7 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#734d2c]"
                >
                  <span>TỰ THIẾT KẾ NGAY</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/in-ao"
                  className="inline-flex h-11 items-center gap-2 border border-line-strong bg-white px-6 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:border-black"
                >
                  <span>XEM BẢNG GIÁ & TẤT CẢ PHÔI</span>
                </Link>
              </div>
            </div>

            {/* Cột phải: Khung minh hoạ quy trình 3 bước */}
            <div className="lg:col-span-5">
              <div className="border border-line bg-white p-6 sm:p-7 shadow-2xs">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Quy trình đặt in online
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#8f633e]">
                    <Sparkles className="h-3.5 w-3.5" /> Nhanh chóng & Dễ dàng
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex items-start gap-4">
                    <span className="grid h-7 w-7 shrink-0 place-items-center bg-black text-xs font-black text-white">
                      01
                    </span>
                    <div>
                      <h4 className="text-xs font-bold uppercase text-ink">Chọn phôi & màu áo</h4>
                      <p className="mt-0.5 text-xs text-muted">
                        Đa dạng phôi áo thun cổ tròn, oversize, hoodie, áo polo với bảng màu phong phú.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="grid h-7 w-7 shrink-0 place-items-center bg-[#8f633e] text-xs font-black text-white">
                      02
                    </span>
                    <div>
                      <h4 className="text-xs font-bold uppercase text-ink">Tải hình ảnh hoặc thiết kế</h4>
                      <p className="mt-0.5 text-xs text-muted">
                        Kéo thả ảnh của bạn vào khung in, tuỳ chỉnh kích thước và vị trí theo ý thích.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="grid h-7 w-7 shrink-0 place-items-center bg-black text-xs font-black text-white">
                      03
                    </span>
                    <div>
                      <h4 className="text-xs font-bold uppercase text-ink">Xem giá & Nhận hàng tận nơi</h4>
                      <p className="mt-0.5 text-xs text-muted">
                        Hệ thống tự động tính giá in. Shop in thành phẩm và giao hàng tận nơi sau 2-3 ngày.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-line pt-4 bg-[#fbfbfb] -mx-6 -mb-6 p-4 text-center">
                  <p className="text-[11px] text-muted">
                    Đã có hàng nghìn khách hàng cá nhân và nhóm bạn tự in áo tại TBC Studio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Phần 2: CÁC DÒNG PHÔI ÁO NỔI BẬT (UI theo yêu cầu) ── */}
        <div className="p-6 sm:p-10 md:p-12 lg:p-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line pb-6">
            <div>
              <span className="inline-block bg-[#8f633e] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-2xs">
                PHÔI IN TIÊU CHUẨN CAO CẤP
              </span>
              <h3 className="mt-2 font-sans text-xl sm:text-2xl lg:text-3xl font-extrabold uppercase text-ink">
                Các Dòng Phôi Áo Nổi Bật
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-muted max-w-2xl">
                Chất liệu cotton tuyển chọn, chuẩn phom dáng, định lượng dày dặn — sẵn sàng in nhanh từ 1 chiếc với công nghệ in kỹ thuật số hiện đại.
              </p>
            </div>

            <Link
              href="/in-ao"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8f633e] hover:text-[#734d2c] transition-colors shrink-0 group"
            >
              <span>Xem tất cả phôi áo</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Lưới các thẻ phôi áo nổi bật */}
          {blanks.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {blanks.map((blank) => (
              <div
                key={blank.slug}
                className="group relative flex flex-col border border-line bg-white transition-all duration-300 hover:border-black hover:shadow-md"
              >
                {/* Khung ảnh mockup phôi */}
                <div className="relative aspect-4/5 w-full bg-[#f9f9f9] overflow-hidden border-b border-line">
                  {blank.badge && (
                    <span className="absolute top-3 left-3 z-10 bg-[#8f633e] text-white text-[10px] font-black uppercase px-2 py-0.5 tracking-wider shadow-2xs">
                      {blank.badge}
                    </span>
                  )}

                  <span className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-xs text-ink text-[10px] font-bold px-2 py-0.5 border border-line">
                    Từ {blank.moq ?? 1} áo
                  </span>

                  <Link href={`/in-ao/${blank.slug}`} className="block h-full w-full">
                    {blank.image ? (
                      <Image
                        src={blank.image}
                        alt={blank.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-contain p-4 sm:p-5 transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center text-xs text-muted">
                        Chưa có ảnh phôi
                      </span>
                    )}
                  </Link>
                </div>

                {/* Thông tin chi tiết phôi */}
                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                  <div>
                    {blank.categoryName && (
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#8f633e]">
                        {blank.categoryName}
                      </p>
                    )}

                    <h4 className="mt-1 font-sans text-sm sm:text-base font-bold text-ink leading-snug">
                      <Link
                        href={`/in-ao/${blank.slug}`}
                        className="transition-colors hover:text-[#8f633e]"
                      >
                        {blank.name}
                      </Link>
                    </h4>

                    <div className="mt-2.5 flex flex-wrap items-baseline gap-x-1.5">
                      <span className="text-xs text-muted">Từ</span>
                      <span
                        className={`text-base font-extrabold tabular-nums ${
                          blank.comparePrice ? "text-[#8f633e]" : "text-ink"
                        }`}
                      >
                        {formatPrice(blank.price)}
                      </span>
                      {blank.comparePrice && (
                        <span className="text-[11px] text-muted line-through tabular-nums">
                          {formatPrice(blank.comparePrice)}
                        </span>
                      )}
                      {blank.comparePrice && blank.discountLabel && (
                        <span className="bg-[#8f633e]/10 px-1 text-[9px] font-bold text-[#8f633e]">
                          {blank.discountLabel}
                        </span>
                      )}
                    </div>

                    {/* Vòng tròn hiển thị bảng màu */}
                    {blank.colors && blank.colors.length > 0 && (
                      <div className="mt-3 flex items-center gap-1.5" title="Màu sắc phôi">
                        {blank.colors.slice(0, 5).map((color, idx) => (
                          <span
                            key={idx}
                            title={color.name}
                            className="h-3.5 w-3.5 rounded-full border border-black/15 shadow-2xs"
                            style={{ backgroundColor: color.hex }}
                          />
                        ))}
                        {blank.colors.length > 5 && (
                          <span className="text-[10px] font-semibold text-muted">
                            +{blank.colors.length - 5}
                          </span>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Nút hành động trực tiếp */}
                  <Link
                    href={`/in-ao/${blank.slug}`}
                    className="mt-5 inline-flex h-10 w-full items-center justify-center gap-1.5 border border-line-strong bg-[#fafafa] text-xs font-bold uppercase tracking-wider text-ink transition-colors group-hover:border-black group-hover:bg-black group-hover:text-white"
                  >
                    <span>Tự Thiết Kế Ngay</span>
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 border border-dashed border-line bg-[#fafafa] px-4 py-8 text-center text-sm text-muted">
              {blanksUnavailable
                ? "Danh sách phôi in đang tạm thời không kết nối được. Vui lòng quay lại sau."
                : "Shop đang chuẩn bị phôi in. Bạn quay lại sau ít hôm nhé."}
            </p>
          )}

          {/* ── Phần 3: Dải cam kết & Tiêu chuẩn xưởng in ── */}
          <div className="mt-10 border-t border-line pt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 place-items-center bg-[#f7f7f7] border border-line text-[#8f633e] shrink-0">
                <Check className="h-4 w-4 stroke-[3]" />
              </div>
              <div>
                <h5 className="text-xs font-bold uppercase text-ink">In Từ 1 Chiếc</h5>
                <p className="mt-0.5 text-[11px] text-muted leading-relaxed">
                  Không áp số lượng tối thiểu, cá nhân hay hội nhóm đều đặt in dễ dàng.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 place-items-center bg-[#f7f7f7] border border-line text-[#8f633e] shrink-0">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold uppercase text-ink">Mực In Gốc Nước</h5>
                <p className="mt-0.5 text-[11px] text-muted leading-relaxed">
                  Công nghệ in kỹ thuật số Nhật Bản, bền màu và không nứt gãy khi giặt.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 place-items-center bg-[#f7f7f7] border border-line text-[#8f633e] shrink-0">
                <Return className="h-4 w-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold uppercase text-ink">Xem Trước 3D Trực Quan</h5>
                <p className="mt-0.5 text-[11px] text-muted leading-relaxed">
                  Kéo thả ảnh, phóng to thu nhỏ và kiểm tra phom dáng chuẩn xác trước khi chốt.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 place-items-center bg-[#f7f7f7] border border-line text-[#8f633e] shrink-0">
                <Ship className="h-4 w-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold uppercase text-ink">Giao Hàng 2 - 3 Ngày</h5>
                <p className="mt-0.5 text-[11px] text-muted leading-relaxed">
                  Sản xuất và đóng gói nhanh chóng, giao hàng tận tay trên toàn quốc.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
