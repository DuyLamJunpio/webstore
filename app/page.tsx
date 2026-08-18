import BestSellers from "@/components/BestSellers";
import Categories from "@/components/Categories";
import FacebookPage from "@/components/FacebookPage";
import Hero from "@/components/Hero";
import InstagramFeed from "@/components/InstagramFeed";
import Journal from "@/components/Journal";
import Marquee from "@/components/Marquee";
import NewArrivals from "@/components/NewArrivals";
import Newsletter from "@/components/Newsletter";
import Promises from "@/components/Promises";
import SeasonalDrop from "@/components/SeasonalDrop";
import ShopeeStore from "@/components/ShopeeStore";
import Testimonials from "@/components/Testimonials";
import { getCatalogue } from "@/lib/catalogue";

export default async function Home() {
  const { bestSellers, bestSellerFilters } = await getCatalogue();

  return (
    <>
      <Hero />
      <NewArrivals />
      <Marquee />
      <SeasonalDrop />
      <Categories />
      <BestSellers products={bestSellers} filters={bestSellerFilters} />
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
