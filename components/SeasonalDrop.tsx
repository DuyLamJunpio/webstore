import Image from "next/image";
import Link from "next/link";
import { seasonalDrop } from "@/lib/data";
import ProductCard from "./ProductCard";
import { ArrowUpRight } from "./icons";

export default function SeasonalDrop() {
  return (
    <section id="seasonal-drop" className="shell section">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="relative min-h-[420px] overflow-hidden rounded-block bg-ink lg:min-h-full">
          <Image
            src="/images/seasonal-drop.png"
            alt="Người mẫu mặc áo khoác thuộc bộ sưu tập theo mùa"
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-cream sm:p-9">
            <h2 className="font-serif text-[clamp(2.25rem,3.4vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.015em]">
              Bộ Sưu Tập Theo Mùa
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/80">
              Số lượng giới hạn cho thời điểm giao mùa — lớp áo ấm, phom dáng dễ mặc.
            </p>
            <Link
              href="/shop?sale=1"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-cream px-6 text-sm font-medium text-ink transition-transform duration-300 hover:-translate-y-0.5"
            >
              Mua ngay
              <ArrowUpRight />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-9">
          {seasonalDrop.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 45vw, 300px"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
