import Image from "next/image";
import { CONTACT } from "@/lib/contact";
import Logo from "./Logo";
import SectionHeading from "./SectionHeading";
import { ArrowUpRight, Facebook } from "./icons";

/**
 * Khối fanpage Facebook trên trang chủ.
 *
 * Cố ý KHÔNG lặp lại lưới sáu ô như khối Instagram ngay phía trên: hai lưới
 * giống hệt nhau nằm cạnh nhau thì mắt lướt qua cả hai. Ở đây dựng theo hình
 * dáng một trang Facebook thật — dải ảnh bìa, avatar tròn đè lên, rồi tên
 * trang — nên nhận ra ngay là fanpage mà không phải nhúng iframe của Facebook
 * (thứ mang nguyên giao diện xanh của họ vào giữa bảng màu kem của trang).
 *
 * Ảnh bìa là ảnh bìa thật đang dùng trên fanpage.
 */
const FACEBOOK_BLUE = "#1877f2";

export default function FacebookPage() {
  return (
    <section id="facebook" className="shell section">
      <SectionHeading
        align="center"
        title="Fanpage của chúng tôi"
        subtitle="Nơi cập nhật mẫu mới và nhắn tin trực tiếp với shop — hỏi size, hỏi màu, hay xem thêm ảnh thật của sản phẩm."
      />

      <div className="mt-12 overflow-hidden rounded-block bg-cream-dark">
        {/*
          ── ảnh bìa ───────────────────────────────────────────────
          Giữ đúng tỉ lệ gốc 960×400 (12/5) thay vì ép vào một chiều cao cố
          định: đây là ảnh thiết kế có chữ, cắt bớt cạnh nào cũng mất chữ.
        */}
        <div className="relative aspect-[12/5] w-full bg-surface">
          <Image
            src="/images/fb-cover.jpg"
            alt="Ảnh bìa fanpage The Basic Concept — áo in thiết kế và quà tặng theo yêu cầu"
            fill
            sizes="(max-width: 1400px) 100vw, 1360px"
            className="object-cover"
          />
        </div>

        {/*
          ── thân trang ────────────────────────────────────────────
          `relative` là bắt buộc chứ không phải thừa: mấy ô ảnh bìa phải
          `position: relative` để `fill` chạy được, nên nếu khối này không được
          định vị thì ảnh bìa vẽ đè lên avatar và tên trang bị `-mt-12` kéo lên.
        */}
        <div className="relative px-6 pb-10 sm:px-10 xl:px-16">
          {/* avatar đè lên ảnh bìa, đúng cách một trang Facebook trông ra sao */}
          {/*
            Chỉ đè avatar lên ảnh bìa từ `sm` trở lên. Ở màn hình hẹp, khối này
            xếp dọc nên avatar rơi vào giữa ảnh bìa và che đúng phần chữ — mà
            ảnh bìa lúc đó đã bé sẵn, mất thêm phần giữa là không còn đọc được.
          */}
          <div className="mt-6 flex flex-col items-center gap-5 text-center sm:-mt-14 sm:flex-row sm:items-end sm:gap-6 sm:text-left">
            {/*
              `aria-hidden` cho cả cụm: bên trong Logo có dòng ẩn "The Basic
              Concept — trang chủ" dành cho trình đọc màn hình, đúng khi nó là
              link ở header nhưng sai ở đây — đây là ảnh đại diện, không dẫn đi
              đâu cả. Tên trang đã nằm ngay ở thẻ h3 bên cạnh.
            */}
            <span
              aria-hidden
              className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-cream shadow-xl ring-4 ring-cream-dark sm:h-28 sm:w-28"
            >
              <Logo variant="monogram" />
            </span>

            <div className="sm:pb-2">
              <h3 className="font-serif text-[clamp(1.6rem,2.4vw,2.15rem)] font-medium leading-tight tracking-[-0.015em]">
                The Basic Concept
              </h3>
              <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] text-muted sm:justify-start">
                <span
                  className="inline-flex items-center gap-1.5 font-medium"
                  style={{ color: FACEBOOK_BLUE }}
                >
                  <Facebook className="h-4 w-4" />
                  Trang chính thức
                </span>
                <span aria-hidden className="text-line-strong">
                  ·
                </span>
                Cửa hàng thời trang
              </p>
            </div>
          </div>

          <p className="mt-7 max-w-2xl text-[15px] leading-relaxed text-muted">
            Bấm theo dõi để không bỏ lỡ đợt hàng về, và nhắn tin bất cứ lúc nào — shop trả lời
            ngay trên Facebook.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href={CONTACT.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-medium text-cream transition-transform duration-300 hover:-translate-y-0.5"
              style={{ backgroundColor: FACEBOOK_BLUE }}
            >
              <Facebook className="h-[18px] w-[18px]" />
              Truy cập Fanpage
              <ArrowUpRight />
            </a>
            <span className="text-[13px] text-muted">Mở tab mới · facebook.com</span>
          </div>
        </div>
      </div>
    </section>
  );
}
