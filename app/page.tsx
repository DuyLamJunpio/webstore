import AnnouncementBar from "@/components/AnnouncementBar";
import BestSellers from "@/components/BestSellers";
import Categories from "@/components/Categories";
import FacebookSection from "@/components/FacebookSection";
import Hero from "@/components/Hero";
import LifeWearStory from "@/components/LifeWearStory";
import LimitedOffer from "@/components/LimitedOffer";
import Newsletter from "@/components/Newsletter";
import PrintOnDemandSection from "@/components/PrintOnDemandSection";
import Promises from "@/components/Promises";
import ShopeeStore from "@/components/ShopeeStore";
import Testimonials from "@/components/Testimonials";
import UniformSection from "@/components/UniformSection";
import { getCatalogue } from "@/lib/catalogue";
import { getContent, heading } from "@/lib/content";
import { bookableBlanks, getPrintCatalogue } from "@/lib/print-catalogue";
import { coverMockup } from "@/lib/print";

export default async function Home() {
  const { bestSellers, bestSellerFilters, newArrivals } = await getCatalogue();
  const content = await getContent();
  const printCatalogue = await getPrintCatalogue();

  /*
   * Trang chủ chỉ bày những phôi có thể đặt thật: còn vị trí in và có ít
   * nhất một kỹ thuật đã khai giá. Cùng hàm lọc này được dùng ở /in-ao,
   * nên thẻ nổi bật không bao giờ dẫn khách đến một studio không dựng được.
   * `sort_order` trong catalogue là thứ tự do quản trị quyết định; lấy bốn phôi đầu
   * tiên tại đây để không tạo thêm một danh sách phôi thủ công thứ hai.
   */
  const featuredBlanks = printCatalogue
    ? bookableBlanks(printCatalogue).slice(0, 4).map((blank) => ({
        id: blank.id,
        slug: blank.slug,
        name: blank.name,
        categoryName: blank.category?.name,
        price: blank.display_price ?? blank.base_price,
        image: coverMockup(blank)?.url ?? null,
        colors: blank.colors.map(({ name, hex }) => ({ name, hex })),
        moq: blank.moq,
        leadDays: blank.lead_days,
      }))
    : [];

  return (
    <>
      <Hero />
      <AnnouncementBar />

      {/* 1. Tìm theo danh mục */}
      <Categories />

      {/* 2. Khuyến mãi có hạn */}
      <LimitedOffer />

      {/* 3. Sản phẩm bán chạy */}
      <BestSellers
        products={bestSellers}
        filters={bestSellerFilters}
        title={heading(content, "best_sellers.title", "Sản Phẩm Bán Chạy")}
        subtitle={heading(
          content,
          "best_sellers.subtitle",
          "Những mẫu trang phục được khách hàng yêu thích và lựa chọn nhiều nhất.",
        )}
      />

      {/* 4. In Thiết Kế theo yêu cầu */}
      <PrintOnDemandSection
        blanks={featuredBlanks}
        blanksUnavailable={!printCatalogue}
      />

      {/* 5. Đồng Phục */}
      <UniformSection />

      {/* Từ phần TRIẾT LÝ LIFEWEAR trở xuống giữ nguyên */}
      <LifeWearStory />
      <ShopeeStore products={newArrivals.slice(0, 2)} />
      <FacebookSection />
      <Promises />
      <Testimonials />
      <Newsletter />
    </>
  );
}
