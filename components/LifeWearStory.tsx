import Link from "next/link";
import { ArrowUpRight, Shield, Sparkles, Leaf } from "./icons";

const features = [
  {
    icon: Sparkles,
    tag: "CHẤT LIỆU CAO CẤP",
    title: "Chất liệu tự nhiên & Thoáng khí",
    desc: "100% sợi Cotton được chọn lọc kỹ càng cùng các chất liệu co giãn đa chiều, mang lại cảm giác mềm mại và nhẹ nhàng trên da suốt ngày dài.",
  },
  {
    icon: Shield,
    tag: "THIẾT KẾ ĐƠN GIẢN",
    title: "Phom dáng chuẩn & Tiện dụng",
    desc: "Tập trung vào đường may tỉ mỉ, độ vừa vặn tối ưu và bảng màu trang nhã, giúp bạn dễ dàng phối đồ trong mọi hoàn cảnh.",
  },
  {
    icon: Leaf,
    tag: "ĐỘ BỀN VƯỢT TRỘI",
    title: "Bền vững theo thời gian",
    desc: "Triết lý LifeWear đề cao sự bền bỉ qua từng lần giặt, hạn chế xù lông và giữ nguyên phom áo, đồng hành cùng bạn qua nhiều mùa thời trang.",
  },
];

export default function LifeWearStory() {
  return (
    <section className="shell section">
      <div className="border border-line bg-[#f7f7f7] p-6 sm:p-10 lg:p-14">
        <div className="max-w-3xl">
          <span className="inline-block bg-[#e60012] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-2xs">
            TRIẾT LÝ LIFEWEAR
          </span>
          <h2 className="mt-3 font-sans text-[clamp(1.85rem,3.8vw,3rem)] font-extrabold uppercase leading-[1.1] tracking-[-0.015em] text-ink">
            Đơn giản tạo nên sự hoàn hảo
          </h2>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#555555]">
            LifeWear là trang phục thường ngày bắt nguồn từ triết lý Nhật Bản về sự đơn giản, chất lượng cao và độ bền.
            Được cải tiến liên tục để làm cho cuộc sống của tất cả mọi người trở nên tiện nghi và tốt đẹp hơn mỗi ngày.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col justify-between border border-line bg-white p-6 transition-all hover:border-black/40"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#e60012]">
                    {item.tag}
                  </span>
                  <h3 className="mt-2 text-base font-bold text-ink">{item.title}</h3>
                  <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[#666666]">{item.desc}</p>
                </div>
                <div className="mt-6 flex items-center gap-2 border-t border-line pt-4 text-xs font-semibold text-ink">
                  <Icon className="h-4 w-4 text-[#e60012]" />
                  <span>Tiêu chuẩn LifeWear</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="text-xs sm:text-[13px] text-[#666666]">
            Sản phẩm được thiết kế và sản xuất tại Việt Nam với tiêu chuẩn may mặc xuất khẩu.
          </p>
          <Link
            href="/shop"
            className="inline-flex h-11 items-center gap-2 bg-ink px-7 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#e60012]"
          >
            <span>KHÁM PHÁ BỘ SƯU TẬP</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
