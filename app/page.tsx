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

export default async function Home() {
  const { bestSellers, bestSellerFilters, newArrivals } = await getCatalogue();
  const content = await getContent();

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
      <PrintOnDemandSection />

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
