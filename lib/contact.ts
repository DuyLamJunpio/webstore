/**
 * Thông tin liên hệ của cửa hàng — một nguồn duy nhất.
 *
 * Footer và nút nổi ở góc trang cùng đọc từ đây, nên đổi số điện thoại là đổi
 * đúng một chỗ. Để riêng khỏi `lib/data.ts` vì file đó đã chạm ngưỡng độ dài,
 * và đây là dữ liệu vận hành chứ không phải catalogue.
 */

/** số nội địa, giữ số 0 đầu — đây là dạng người Việt đọc và lưu danh bạ */
const PHONE = "0948901193";

export const CONTACT = {
  /** hiển thị: tách nhóm cho dễ đọc và dễ đọc to qua điện thoại */
  phoneDisplay: "0948 901 193",

  /**
   * `tel:` dùng dạng E.164 (+84…), bỏ số 0 đầu.
   * Máy đang roaming hoặc dùng SIM nước ngoài sẽ quay sai nếu để "0948…".
   */
  phoneHref: `tel:+84${PHONE.slice(1)}`,

  /** zalo.me nhận thẳng số nội địa, không cần +84 */
  zaloUrl: `https://zalo.me/${PHONE}`,

  facebookUrl: "https://www.facebook.com/profile.php?id=61591378517545",
} as const;
