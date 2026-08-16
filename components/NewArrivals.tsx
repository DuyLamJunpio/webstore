import { newArrivals } from "@/lib/data";
import ProductCard from "./ProductCard";
import SectionHeading from "./SectionHeading";

export default function NewArrivals() {
  return (
    <section id="new-arrivals" className="shell section">
      <SectionHeading
        title="Hàng mới đã về"
        action={{ label: "Xem thêm", href: "/shop?new=1" }}
      />

      <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
        {newArrivals.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}
