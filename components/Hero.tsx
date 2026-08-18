import { getContent } from "@/lib/content";
import HeroCarousel from "./HeroCarousel";

/**
 * Hero đầu trang chủ. Chỉ lo lấy dữ liệu; phần chạy slide nằm ở HeroCarousel
 * vì nó cần chạy trên trình duyệt.
 */
export default async function Hero() {
  const { slides } = await getContent();

  return <HeroCarousel slides={slides} />;
}
