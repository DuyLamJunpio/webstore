import Link from "next/link";
import { ArrowUpRight, Check, Sparkles } from "./icons";

export default function PrintOnDemandSection() {
  return (
    <section id="in-thiet-ke" className="shell section">
      <div className="border border-line bg-[#f7f7f7] p-6 sm:p-10 md:p-12 lg:p-14">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 items-center">
          {/* Cột trái: Thông điệp & CTA */}
          <div className="lg:col-span-7">
            <span className="inline-block bg-[#8f633e] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-2xs">
              UTme! STUDIO · CÔNG NGHỆ IN SẮC NÉT
            </span>

            <h2 className="mt-3 font-sans text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold uppercase leading-[1.1] tracking-[-0.015em] text-ink">
              In Thiết Kế Theo Yêu Cầu
            </h2>

            <p className="mt-3.5 max-w-xl text-sm sm:text-[15px] leading-relaxed text-[#555555]">
              Tự do sáng tạo chiếc áo mang dấu ấn riêng của bạn. Tải hình vẽ, ảnh chụp, logo hội nhóm hoặc
              thông điệp độc bản — kéo thả trực quan lên áo, xem trước mô phỏng thực tế và biết giá ngay lập
              tức từ chỉ <strong>1 chiếc</strong>.
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
                <span>XEM BẢNG GIÁ & PHÔI ÁO</span>
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
    </section>
  );
}
