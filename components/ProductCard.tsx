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

  const discountPercent =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round((1 - product.price / product.comparePrice) * 100)
      : 0;

  return (
    <article className="group relative flex h-full flex-col bg-white">
      {/* ── Khung ảnh sản phẩm chuẩn UNIQLO (vuông vắn, sắc nét) ── */}
      <div className="relative">
        <Link
          href={href}
          className="swap relative block overflow-hidden bg-[#f4f4f4] border border-[#e5e5e5] transition-all duration-300 group-hover:border-black/30"
        >
          <span className="relative block aspect-[3/4] sm:aspect-[4/5]">
            <MediaFrame media={cover} alt={product.name} sizes={sizes} className="swap-front object-cover" />
            <MediaFrame
              media={hover}
              alt=""
              sizes={sizes}
              className="swap-back absolute inset-0 opacity-0 object-cover"
            />
            {cover.type === "video" && (
              <PlayBadge className="absolute bottom-2.5 left-2.5 h-7 w-7" />
            )}
          </span>

          {/* ── Nhãn Tag hình chữ nhật chuẩn UNIQLO ── */}
          <div className="absolute left-0 top-0 flex flex-col items-start gap-1 z-10">
            {!available ? (
              <span className="bg-[#555555] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-2xs">
                HẾT HÀNG
              </span>
            ) : discountPercent > 0 ? (
              <span className="bg-[#e60012] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-2xs">
                LIMITED OFFER
              </span>
            ) : product.isNew ? (
              <span className="bg-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-2xs">
                NEW
              </span>
            ) : null}
          </div>

          <span
            aria-hidden
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center bg-white/90 text-ink shadow-xs opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100"
          >
            <Heart className="h-3.5 w-3.5" />
          </span>
        </Link>

        {SHOW_QUICK_ADD && available && <QuickAdd product={product} />}
      </div>

      {/* ── Thông tin sản phẩm ── */}
      <div className="mt-2.5 flex flex-1 flex-col justify-between">
        <div>
          {/* Swatches màu sắc */}
          {product.colors.length > 0 && (
            <div className="mb-2 flex items-center gap-1.5">
              {product.colors.slice(0, 5).map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className="h-3 w-3 rounded-full border border-black/20"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              {product.colors.length > 5 && (
                <span className="text-[10px] text-muted font-medium">+{product.colors.length - 5}</span>
              )}
            </div>
          )}

          {/* Audience & Category tag */}
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#767676]">
            {product.audience} · {product.category}
          </div>

          <h3 className="mt-1 line-clamp-2 text-[13px] sm:text-[14px] font-semibold leading-snug text-ink transition-colors group-hover:text-[#e60012]" title={product.name}>
            <Link href={href}>{product.name}</Link>
          </h3>
        </div>

        {/* Khối giá sản phẩm */}
        <div className="mt-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              className={`text-[14px] sm:text-[15px] font-bold ${
                discountPercent > 0 ? "text-[#e60012]" : "text-ink"
              }`}
            >
              {formatPrice(product.price)}
            </span>
            {discountPercent > 0 && product.comparePrice && (
              <>
                <span className="text-[11px] text-muted line-through">
                  {formatPrice(product.comparePrice)}
                </span>
                <span className="bg-[#e60012]/10 px-1 py-0.2 text-[9px] font-bold text-[#e60012]">
                  -{discountPercent}%
                </span>
              </>
            )}
          </div>

          {/* Rating đánh giá */}
          <div className="mt-1 flex items-center gap-1 text-[11px] text-muted">
            <span className="text-[#e60012]">★</span>
            <span className="font-semibold text-ink">{product.rating.toFixed(1)}</span>
            <span>({product.reviews})</span>
          </div>
        </div>
      </div>
    </article>
  );
}
