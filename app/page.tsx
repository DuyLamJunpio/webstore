import BestSellers from "@/components/BestSellers";
import Categories from "@/components/Categories";
import Hero from "@/components/Hero";
import InstagramFeed from "@/components/InstagramFeed";
import Journal from "@/components/Journal";
import Marquee from "@/components/Marquee";
import NewArrivals from "@/components/NewArrivals";
import Newsletter from "@/components/Newsletter";
import Promises from "@/components/Promises";
import SeasonalDrop from "@/components/SeasonalDrop";
import Testimonials from "@/components/Testimonials";

export default function Home() {
  return (
    <>
      <Hero />
      <NewArrivals />
      <Marquee />
      <SeasonalDrop />
      <Categories />
      <BestSellers />
      <Promises />
      <Testimonials />
      <Journal />
      <InstagramFeed />
      <Newsletter />
    </>
  );
}
