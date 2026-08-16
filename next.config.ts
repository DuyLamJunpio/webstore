import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * `next dev` serves its assets to localhost only; any other origin gets a 403
   * on /_next/static/chunks/*.js, which means React never hydrates and the whole
   * page becomes a dead screenshot. Opening the site from the LAN IP (phone,
   * second machine, `next dev -H 0.0.0.0`) needs that origin listed here.
   * Development only — it has no effect on `next build` / `next start`.
   *
   * Các dải IP nội bộ được khai bằng ký tự đại diện thay vì một địa chỉ cụ thể:
   * router cấp lại IP khác — hoặc đổi sang mạng khác — là danh sách cũ hết khớp,
   * và lỗi quay lại đúng dạng khó đoán "trang mở được nhưng bấm gì cũng không
   * ăn". Bộ so khớp của Next cắt địa chỉ theo dấu chấm, nên `192.168.*.*` phủ
   * trọn dải đó mà không phải sửa file này mỗi lần đổi mạng.
   */
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
};

export default nextConfig;
