import { getCatalogue } from "@/lib/catalogue";
import { getContent, heading } from "@/lib/content";
import ProductCard from "./ProductCard";
import SectionHeading from "./SectionHeading";

export default async function NewArrivals() {
  const { newArrivals } = await getCatalogue();
  const content = await getContent();

  return (
    <section id="new-arrivals" className="shell section">
      <SectionHeading
        title={heading(content, "new_arrivals.title", "Hàng Mới Về")}
        action={{ label: "Xem tất cả", href: "/shop?new=1" }}
      />

      <div className="mt-8 sm:mt-12 grid grid-cols-2 gap-x-3.5 gap-y-7 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-5">
        {newArrivals.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}

