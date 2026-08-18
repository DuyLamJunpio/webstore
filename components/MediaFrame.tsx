import Image from "next/image";
import type { Media } from "@/lib/data";

/**
 * Một ô media lấp đầy khung cha — cha phải có `position: relative`.
 *
 * Video được dùng thay ảnh tĩnh: trình duyệt vẽ sẵn khung hình đầu, nên sản phẩm
 * mới quay video mà chưa chụp ảnh vẫn có "ảnh" để bày, không phải chờ ai cắt ảnh
 * bìa thủ công. `object-cover` cắt đúng như ảnh nên bố cục lưới không đổi.
 *
 * KHÔNG thêm mảnh `#t=0.1` để lấy khung đẹp hơn: tua tới một mốc bất kỳ buộc
 * trình duyệt gửi Range request, mà máy chủ quản trị đang trả nguyên file kèm
 * 200 thay vì 206. Chrome coi như nguồn hỏng (networkState = NO_SOURCE) và ô ảnh
 * trống trơn. Bao giờ máy chủ đó hỗ trợ Range thì mới quay lại chuyện chọn khung.
 */
export default function MediaFrame({
  media,
  alt,
  sizes,
  priority,
  className = "",
}: {
  media: Media;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (media.type === "video") {
    return (
      <video
        src={media.src}
        muted
        playsInline
        preload="metadata"
        // video trang trí, nội dung đã nằm ở tên sản phẩm ngay cạnh
        aria-hidden
        tabIndex={-1}
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <Image
      src={media.src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={`object-cover ${className}`}
    />
  );
}

/** Dấu tam giác báo ô này là video, đè lên khung hình tĩnh. */
export function PlayBadge({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none grid place-items-center rounded-full bg-ink/55 text-cream backdrop-blur ${className}`}
    >
      <svg viewBox="0 0 12 12" className="h-1/2 w-1/2 translate-x-[6%]" fill="currentColor">
        <path d="M3 1.5 10 6l-7 4.5z" />
      </svg>
    </span>
  );
}
