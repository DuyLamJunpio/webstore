import Image from "next/image";
import Link from "next/link";
import { formatPrice, inStock, type Product } from "@/lib/data";
import QuickAdd from "./QuickAdd";
import { Heart } from "./icons";

/**
 * Thêm nhanh đã làm và đã kiểm thử nhưng tạm ẩn — đổi thành true để hiện lại nút
 * trên mọi thẻ sản phẩm (components/QuickAdd.tsx).
 */
const SHOW_QUICK_ADD = false;

export default function ProductCard({
  product,
  sizes = "(max-width: 640px) 70vw, (max-width: 1024px) 33vw, 260px",
}: {
  product: Product;
  sizes?: string;
}) {
  const available = inStock(product);
  const href = `/products/${product.slug}`;

  return (
    <article className="group flex h-full flex-col">
      {/* nút thêm nhanh nằm đè lên ảnh nhưng ở ngoài thẻ liên kết */}
      <div className="relative">
        <Link
          href={href}
          className="swap relative block overflow-hidden rounded-card bg-surface ring-1 ring-line"
        >
          <span className="relative block aspect-square">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes={sizes}
              className="swap-front object-cover"
            />
            <Image
              src={product.hoverImage}
              alt=""
              aria-hidden
              fill
              sizes={sizes}
              className="swap-back absolute inset-0 object-cover opacity-0"
            />
          </span>

          {!available ? (
            <span className="eyebrow absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1.5 text-[9px] leading-none text-cream">
              Hết hàng
            </span>
          ) : product.isNew ? (
            <span className="eyebrow absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1.5 text-[9px] leading-none text-cream">
              Mới
            </span>
          ) : null}

          <span
            aria-hidden
            className="absolute right-3 top-3 grid h-9 w-9 translate-y-1 place-items-center rounded-full bg-surface/90 opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
          >
            <Heart className="h-4 w-4" />
          </span>
        </Link>

        {SHOW_QUICK_ADD && available && <QuickAdd product={product} />}
      </div>

      <div className="mt-3.5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[17px] font-medium leading-snug">
            <Link href={href}>{product.name}</Link>
          </h3>
          <p className="mt-1 text-[13px] text-muted">{product.colors.length} màu</p>
        </div>
        <p className="flex shrink-0 items-baseline gap-1.5 text-[15px]">
          <span className="font-medium">{formatPrice(product.price)}</span>
          {product.comparePrice && (
            <span className="text-[13px] text-muted line-through">
              {formatPrice(product.comparePrice)}
            </span>
          )}
        </p>
      </div>
    </article>
  );
}
