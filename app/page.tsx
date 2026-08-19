import AnnouncementBar from "@/components/AnnouncementBar";
import BestSellers from "@/components/BestSellers";
import Categories from "@/components/Categories";
import FacebookPage from "@/components/FacebookPage";
import Hero from "@/components/Hero";
import InstagramFeed from "@/components/InstagramFeed";
import Journal from "@/components/Journal";
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
      <SeasonalDrop />
      <Categories />
      <BestSellers
        products={bestSellers}
        filters={bestSellerFilters}
        title={heading(content, "best_sellers.title", "Bán chạy nhất")}
        subtitle={heading(content, "best_sellers.subtitle", "Những mẫu được khách chọn nhiều nhất.")}
      />
      <Promises />
      <ShopeeStore />
      <Testimonials />
      <Journal />
      <InstagramFeed />
      <FacebookPage />
      <Newsletter />
    </>
  );
}
