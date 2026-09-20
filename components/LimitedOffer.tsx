import { getCatalogue } from "@/lib/catalogue";
import { getContent, heading } from "@/lib/content";
import type { Product } from "@/lib/data";
import ProductCard from "./ProductCard";
import SectionHeading from "./SectionHeading";

export default async function LimitedOffer() {
  const { products } = await getCatalogue();
  const content = await getContent();

  if (products.length === 0) return null;

  // Lọc sản phẩm có giá khuyến mãi thật sự từ hệ thống
  const realSaleProducts = products.filter(
    (p) => typeof p.comparePrice === "number" && p.comparePrice > p.price,
  );

  // Nếu trong kho tạm chưa có sản phẩm nào set comparePrice, lấy 4 sản phẩm tiêu biểu và hiển thị giá ưu đãi mẫu
  const promoProducts: Product[] =
    realSaleProducts.length >= 2
      ? realSaleProducts.slice(0, 8)
      : products.slice(0, 4).map((p) => ({
          ...p,
          comparePrice:
            typeof p.comparePrice === "number" && p.comparePrice > p.price
              ? p.comparePrice
              : Math.round((p.price * 1.25) / 1000) * 1000,
        }));

  return (
    <section id="limited-offer" className="shell section">
      <SectionHeading
        eyebrow="LIMITED OFFER"
        title={heading(content, "limited_offer.title", "KHUYẾN MÃI CÓ HẠN")}
        subtitle="Cơ hội sở hữu các sản phẩm LifeWear chất lượng cao với mức giá ưu đãi đặc biệt trong thời gian giới hạn."
        action={{ label: "XEM TẤT CẢ KHUYẾN MÃI", href: "/shop?sale=1" }}
      />

      <div className="mt-8 grid grid-cols-2 gap-x-3.5 gap-y-7 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {promoProducts.map((product) => (
          <ProductCard
            key={product.slug}
            product={product}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ))}
      </div>
    </section>
  );
}
