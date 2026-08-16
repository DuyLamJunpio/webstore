import { CONTACT } from "@/lib/contact";
import { Facebook, Phone } from "./icons";

/**
 * Hai nút liên hệ neo ở góc phải dưới, có mặt trên mọi trang.
 *
 * `z-50` là cố ý: ngăn giỏ hàng chạy ở `z-70`, nên khi mở giỏ thì hai nút này
 * nằm dưới lớp phủ thay vì đè lên và che mất nút thanh toán.
 *
 * Không nhúng ảnh logo Zalo: chữ "Zalo" trắng trên nền xanh thương hiệu chính
 * là cách nhận diện của họ, mà lại không phải tải thêm tệp nào.
 */
const bubble =
  "pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-full bg-ink px-3.5 py-1.5 text-[13px] text-cream opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100";

const button =
  "group relative grid h-13 w-13 place-items-center rounded-full shadow-lg ring-1 ring-black/5 transition-transform duration-300 hover:-translate-y-0.5";

export default function FloatingContact() {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 print:hidden">
      <a
        href={CONTACT.facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Fanpage Facebook của The Basic Concept"
        className={button}
        style={{ backgroundColor: "#1877f2" }}
      >
        <span className={bubble}>Nhắn Facebook</span>
        <Facebook className="h-6 w-6 text-white" />
      </a>

      <a
        href={CONTACT.zaloUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Nhắn tin Zalo tới ${CONTACT.phoneDisplay}`}
        className={button}
        style={{ backgroundColor: "#0068ff" }}
      >
        <span className={bubble}>Nhắn Zalo</span>
        <span aria-hidden className="text-[13px] font-bold italic tracking-tight text-white">
          Zalo
        </span>
      </a>

      {/*
        Vàng đồng chứ không phải màu mực: nút này trôi qua cả nền kem của thân
        trang lẫn nền mực của footer, mà mực trên mực thì biến mất hoàn toàn.
      */}
      <a
        href={CONTACT.phoneHref}
        aria-label={`Gọi ${CONTACT.phoneDisplay}`}
        className={`${button} bg-gold text-cream`}
      >
        <span className={bubble}>Gọi {CONTACT.phoneDisplay}</span>
        <Phone className="h-[22px] w-[22px]" />
      </a>
    </div>
  );
}
