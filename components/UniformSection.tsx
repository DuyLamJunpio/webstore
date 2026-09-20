import Link from "next/link";
import { CONTACT } from "@/lib/contact";
import { ArrowUpRight, Check, Messenger, Phone, Shield, Sparkles } from "./icons";

export default function UniformSection() {
  return (
    <section id="dong-phuc" className="shell section">
      <div className="border border-line bg-white shadow-xs">
        <div className="p-6 sm:p-10 md:p-12 lg:p-14">
          {/* ── Tiêu đề khối ── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-line pb-6">
            <div className="max-w-2xl">
              <span className="inline-block bg-[#8f633e] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-2xs">
                GIẢI PHÁP DOANH NGHIỆP & TẬP THỂ
              </span>
              <h2 className="mt-2 font-sans text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold uppercase leading-[1.1] tracking-[-0.015em] text-ink">
                Đồng Phục & Đơn Hàng Lớn
              </h2>
              <p className="mt-2.5 text-sm sm:text-[15px] leading-relaxed text-[#555555]">
                Tư vấn, thiết kế và may in đồng phục công ty, áo sự kiện, áo lớp, áo nhóm theo tiêu chuẩn
                LifeWear bền đẹp — đồng hành cùng hình ảnh chuyên nghiệp của tổ chức bạn.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-[#f4f4f4] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ink border border-line">
                <Sparkles className="h-3.5 w-3.5 text-[#8f633e]" /> Chiết khấu tới 35%
              </span>
            </div>
          </div>

          {/* ── 4 Lợi thế cạnh tranh ── */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-line bg-[#f7f7f7] p-5">
              <div className="grid h-8 w-8 place-items-center bg-white border border-line text-[#8f633e]">
                <Check className="h-4 w-4 stroke-[3]" />
              </div>
              <h3 className="mt-3.5 text-xs font-bold uppercase tracking-wider text-ink">
                Chiết Khấu Số Lượng Lớn
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Chính sách giá bậc thang ưu đãi theo số lượng áo (10, 50, 100 đến 1.000+ chiếc), giá gốc trực tiếp từ xưởng may.
              </p>
            </div>

            <div className="border border-line bg-[#f7f7f7] p-5">
              <div className="grid h-8 w-8 place-items-center bg-white border border-line text-[#8f633e]">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="mt-3.5 text-xs font-bold uppercase tracking-wider text-ink">
                Lên Mẫu & Thiết Kế Miễn Phí
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Hỗ trợ mô phỏng thiết kế 3D chuẩn màu nhận diện thương hiệu. May mẫu thực tế đối soát chất lượng trước khi sản xuất hàng loạt.
              </p>
            </div>

            <div className="border border-line bg-[#f7f7f7] p-5">
              <div className="grid h-8 w-8 place-items-center bg-white border border-line text-[#8f633e]">
                <Shield className="h-4 w-4" />
              </div>
              <h3 className="mt-3.5 text-xs font-bold uppercase tracking-wider text-ink">
                Chất Vải Tuyển Chọn
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Đa dạng chất liệu phôi: Cotton Compact 100%, Cá sấu Poly thể thao, CVC chống nhăn, thoáng mát và co giãn thoải mái.
              </p>
            </div>

            <div className="border border-line bg-[#f7f7f7] p-5">
              <div className="grid h-8 w-8 place-items-center bg-white border border-line text-[#8f633e]">
                <Check className="h-4 w-4 stroke-[3]" />
              </div>
              <h3 className="mt-3.5 text-xs font-bold uppercase tracking-wider text-ink">
                Đúng Tiến Độ & Đầy Đủ VAT
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Cam kết giao hàng đúng hẹn cho các dịp sự kiện hoặc khai trương. Cung cấp đầy đủ hợp đồng kinh tế và hoá đơn GTGT (VAT).
              </p>
            </div>
          </div>

          {/* ── Hộp hành động kết nối nhanh ── */}
          <div className="mt-8 border border-line bg-[#fbfbfb] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#8f633e]">
                Tư vấn trực tiếp cho tổ chức & doanh nghiệp
              </p>
              <h4 className="mt-1 text-base sm:text-lg font-bold text-ink">
                Bạn cần bảng báo giá chi tiết và tư vấn chất liệu phôi cho đơn hàng sắp tới?
              </h4>
              <p className="mt-1 text-xs text-muted">
                Đội ngũ chuyên viên của chúng tôi sẽ phản hồi trong vòng 15 phút kèm bảng màu và báo giá tối ưu nhất.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href={CONTACT.zaloUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 bg-[#0084FF] px-6 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-opacity hover:opacity-90"
              >
                <Messenger className="h-4 w-4" />
                <span>Nhắn Zalo Nhận Báo Giá</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>

              <a
                href={CONTACT.phoneHref}
                className="inline-flex h-11 items-center justify-center gap-2 border border-line-strong bg-white px-6 text-xs font-bold uppercase tracking-wider text-ink shadow-2xs transition-colors hover:border-black"
              >
                <Phone className="h-3.5 w-3.5 text-[#8f633e]" />
                <span>Gọi Hotline {CONTACT.phoneDisplay}</span>
              </a>

              <Link
                href="/in-ao"
                className="inline-flex h-11 items-center justify-center gap-2 bg-[#8f633e] px-6 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#734d2c]"
              >
                <span>Xem Studio In Áo</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
