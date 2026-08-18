import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Nạp .env ngay tại đây: file cấu hình này được đọc trước khi Next nạp biến môi
// trường, nên nếu không gọi thì WAREHOUSE_API_URL còn rỗng và danh sách máy chủ
// ảnh bên dưới ra rỗng theo — ảnh sản phẩm sẽ bị chặn với lỗi khó đoán
// "url parameter is not allowed".
loadEnvConfig(process.cwd());

/**
 * Ảnh sản phẩm có thể nằm ở hai nơi, next/image phải được phép tải từ cả hai:
 *
 *  - Kho ngoài (Supabase Storage) — nơi trang quản trị lưu ảnh từ khi chuyển
 *    sang máy chủ đám mây, khai bằng WAREHOUSE_MEDIA_URL.
 *  - Chính máy chủ trang quản trị — cách cũ, còn giữ để những ảnh lưu trước đây
 *    và môi trường chạy local với disk `local` vẫn hiển thị được.
 *
 * Suy từ biến môi trường thay vì gõ cứng địa chỉ: đổi kho ảnh hay đổi máy chủ
 * quản trị là chỉ sửa .env, không phải sửa file này.
 */
const remotePattern = (raw: string | undefined, fallbackPath: string) => {
  if (!raw) return [];

  const url = new URL(raw);
  // Đường dẫn trong URL gốc chính là tiền tố hợp lệ, ví dụ bucket của Supabase
  // nằm ở /storage/v1/object/public/warehouse — chỉ mở đúng nhánh đó.
  const prefix = url.pathname.replace(/\/$/, "");

  return [
    {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port,
      pathname: `${prefix || fallbackPath}/**`,
    },
  ];
};

const warehouseImages = [
  ...remotePattern(process.env.WAREHOUSE_MEDIA_URL, ""),
  ...remotePattern(process.env.WAREHOUSE_API_URL, "/storage"),
];

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
  images: {
    remotePatterns: warehouseImages,
    /**
     * Next 16 chỉ nhận những mức nén khai sẵn ở đây, mức nào không khai thì bị
     * cảnh báo rồi bỏ qua. 75 là mặc định cho cả trang; 90 dành riêng cho khung
     * xem ảnh phóng to — khách zoom vào là để soi chất vải và đường may, ảnh nén
     * như ở thẻ sản phẩm sẽ vỡ hết chi tiết.
     */
    qualities: [75, 90],
    /**
     * Next 16 chặn tối ưu ảnh từ mọi địa chỉ IP nội bộ để phòng SSRF: máy chủ
     * Next tải URL do dữ liệu chỉ định, kẻ tấn công đổi được URL đó là đọc được
     * dịch vụ nội bộ không lộ ra Internet.
     *
     * Lúc phát triển thì trang quản trị chạy ngay ở 127.0.0.1:8000 nên bị chặn
     * hết — mở riêng cho `next dev`. KHÔNG bật khi chạy thật: server thật phải
     * lấy ảnh qua tên miền công khai của trang quản trị, còn giữ chốt chặn này.
     */
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },

  allowedDevOrigins: ["127.0.0.1", "192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
};

export default nextConfig;
