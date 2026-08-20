import Link from "next/link";
import { coverOf, formatPrice, inStock, type Product } from "@/lib/data";
import MediaFrame, { PlayBadge } from "./MediaFrame";
import QuickAdd from "./QuickAdd";
import { Heart } from "./icons";

const SHOW_QUICK_ADD = true;

export default function ProductCard({
  product,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px",
}: {
  product: Product;
  sizes?: string;
}) {
  const available = inStock(product);
  const href = `/products/${product.slug}`;
  const [cover, hover] = coverOf(product);

  const discountPercent = product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;

  return (
    <article className="group relative flex h-full flex-col">
      {/* ── Khung ảnh sản phẩm ── */}
      <div className="relative">
        <Link
          href={href}
          className="swap relative block overflow-hidden rounded-card bg-surface ring-1 ring-line shadow-xs transition-shadow duration-300 group-hover:shadow-md"
        >
          <span className="relative block aspect-[4/5] sm:aspect-square">
            <MediaFrame media={cover} alt={product.name} sizes={sizes} className="swap-front" />
            <MediaFrame
              media={hover}
              alt=""
              sizes={sizes}
              className="swap-back absolute inset-0 opacity-0"
            />
            {cover.type === "video" && (
              <PlayBadge className="absolute bottom-3 left-3 h-8 w-8" />
            )}
          </span>

          {/* ── Badges ── */}
          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5 z-10">
            {!available ? (
              <span className="eyebrow rounded-full bg-ink/90 backdrop-blur-xs px-2.5 py-1 text-[9px] font-bold text-cream shadow-xs">
                Hết hàng
              </span>
            ) : discountPercent > 0 ? (
              <span className="eyebrow rounded-full bg-[#c2410c] text-white px-2.5 py-1 text-[9px] font-bold shadow-xs">
                -{discountPercent}%
              </span>
            ) : product.isNew ? (
              <span className="eyebrow rounded-full bg-gold px-2.5 py-1 text-[9px] font-bold text-cream shadow-xs">
                Mới
              </span>
            ) : null}
          </div>

          <span
            aria-hidden
            className="absolute right-2.5 top-2.5 grid h-8 w-8 translate-y-1 place-items-center rounded-full bg-white/90 text-ink shadow-xs opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
          >
            <Heart className="h-3.5 w-3.5" />
          </span>
        </Link>

        {SHOW_QUICK_ADD && available && <QuickAdd product={product} />}
      </div>

      {/* ── Thông tin sản phẩm ── */}
      <div className="mt-3 flex flex-1 flex-col justify-between">
        <div>
          {/* Swatches màu sắc */}
          {product.colors.length > 1 && (
            <div className="mb-1.5 flex items-center gap-1">
              {product.colors.slice(0, 4).map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-line-strong/60"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[10px] text-muted">+{product.colors.length - 4}</span>
              )}
            </div>
          )}

          <h3 className="line-clamp-2 text-[14px] sm:text-[15px] font-medium leading-snug text-ink transition-colors group-hover:text-gold-deep" title={product.name}>
            <Link href={href}>{product.name}</Link>
          </h3>
        </div>

        <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
          <span className="text-[14px] sm:text-[15px] font-semibold text-ink">
            {formatPrice(product.price)}
          </span>
          {product.comparePrice && (
            <span className="text-[12px] text-muted line-through">
              {formatPrice(product.comparePrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

