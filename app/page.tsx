import AnnouncementBar from "@/components/AnnouncementBar";
import BestSellers from "@/components/BestSellers";
import Categories from "@/components/Categories";
import Hero from "@/components/Hero";
import NewArrivals from "@/components/NewArrivals";
import Newsletter from "@/components/Newsletter";
import Promises from "@/components/Promises";
import SeasonalDrop from "@/components/SeasonalDrop";
import ShopeeStore from "@/components/ShopeeStore";
import Testimonials from "@/components/Testimonials";
import { getCatalogue } from "@/lib/catalogue";
import { getContent, heading } from "@/lib/content";

export default async function Home() {
  const { bestSellers, bestSellerFilters } = await getCatalogue();
  const content = await getContent();

  return (
    <>
      <Hero />
      <AnnouncementBar />
      <NewArrivals />
      <Categories />
      <SeasonalDrop />
      <BestSellers
        products={bestSellers}
        filters={bestSellerFilters}
        title={heading(content, "best_sellers.title", "Bán Chạy Nhất")}
        subtitle={heading(content, "best_sellers.subtitle", "Những mẫu trang phục được khách hàng yêu thích và lựa chọn nhiều nhất.")}
      />
      <ShopeeStore />
      <Promises />
      <Testimonials />
      <Newsletter />
    </>
  );
}

