"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "./cart";
import {
  IS_TEST_PRICING,
  findVariant,
  styleOfVariant,
  stylesOf,
  type Product,
  type ProductColor,
  type ProductStyle,
  type Variant,
} from "./data";

export const LOW_STOCK = 4;

const belongsToStyle = (product: Product, variant: Variant, styleId: string) =>
  styleOfVariant(product, variant).id === styleId;

const colorsOfStyle = (product: Product, styleId: string): ProductColor[] => {
  const names = [
    ...new Set(
      product.variants
        .filter((variant) => belongsToStyle(product, variant, styleId))
        .map((variant) => variant.color),
    ),
  ];
  const known = new Map(product.colors.map((option) => [option.name, option]));
  return names.map((name) => known.get(name) ?? { name, hex: "#d8c4a4" });
};

const firstColorOfStyle = (product: Product, styleId: string) => {
  const options = colorsOfStyle(product, styleId);
  return (
    options.find((option) =>
      product.variants.some(
        (variant) =>
          belongsToStyle(product, variant, styleId) &&
          variant.color === option.name &&
          variant.stock > 0,
      ),
    )?.name ??
    options[0]?.name ??
    "Mặc định"
  );
};

/**
 * Toàn bộ những gì cần để chọn mẫu + màu + size + số lượng rồi cho vào giỏ hoặc mua ngay.
 * Dùng chung cho trang chi tiết và bảng thêm nhanh, nên hai nơi không bao giờ
 * hiểu khác nhau về việc món nào còn bán được.
 */
export function useVariantSelection(product: Product) {
  const { add } = useCart();
  const router = useRouter();

  const styles = useMemo(() => stylesOf(product), [product]);

  // Bắt đầu ở mẫu đầu tiên còn ít nhất một tổ hợp mua được.
  const initialStyle =
    styles.find((option) =>
      product.variants.some(
        (variant) => belongsToStyle(product, variant, option.id) && variant.stock > 0,
      ),
    ) ?? styles[0];

  const [styleId, setStyleId] = useState(initialStyle.id);
  const [color, setColor] = useState(() => firstColorOfStyle(product, initialStyle.id));
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);

  const style: ProductStyle = styles.find((option) => option.id === styleId) ?? initialStyle;
  const availableColors = useMemo(
    () => colorsOfStyle(product, style.id),
    [product, style.id],
  );

  const availableSizes = useMemo(() => {
    const present = new Set(
      product.variants
        .filter(
          (variant) =>
            belongsToStyle(product, variant, style.id) && variant.color === color,
        )
        .map((variant) => variant.size),
    );
    const ordered = product.sizes.filter((option) => present.has(option));
    const known = new Set(ordered);
    return [
      ...ordered,
      ...[...present].filter((option) => !known.has(option)),
    ];
  }, [product, style.id, color]);

  const stockBySize = useMemo(
    () =>
      Object.fromEntries(
        availableSizes.map((option) => [
          option,
          findVariant(product, style.id, color, option)?.stock ?? 0,
        ]),
      ) as Record<string, number>,
    [product, style.id, color, availableSizes],
  );

  const variant = size ? findVariant(product, style.id, color, size) : undefined;

  /**
   * Giá hiện lên và giá vào giỏ phải là giá của biến thể đang chọn: bên quản trị
   * cho đặt "giá riêng" cho từng size/màu, lấy giá chung là bán sai tiền.
   * Chưa chọn size thì chưa biết biến thể nào, tạm hiện giá chung.
   */
  const price = !IS_TEST_PRICING && variant?.price ? variant.price : product.price;
  const styleSoldOut = !product.variants.some(
    (candidate) => belongsToStyle(product, candidate, style.id) && candidate.stock > 0,
  );
  const colorSoldOut =
    availableSizes.length === 0 || availableSizes.every((option) => stockBySize[option] === 0);

  const isStyleSoldOut = (id: string) =>
    !product.variants.some(
      (variant) => belongsToStyle(product, variant, id) && variant.stock > 0,
    );

  const isColorSoldOut = (name: string) =>
    !product.variants.some(
      (variant) =>
        belongsToStyle(product, variant, style.id) &&
        variant.color === name &&
        variant.stock > 0,
    );

  const pickStyle = (id: string) => {
    const nextStyle = styles.find((option) => option.id === id);
    if (!nextStyle || nextStyle.id === style.id) return;

    const currentColorStillAvailable = product.variants.some(
      (variant) =>
        belongsToStyle(product, variant, nextStyle.id) &&
        variant.color === color &&
        variant.stock > 0,
    );
    const nextColor = currentColorStillAvailable
      ? color
      : firstColorOfStyle(product, nextStyle.id);

    setStyleId(nextStyle.id);
    setColor(nextColor);
    setError(null);
    // Size chỉ được giữ nếu đúng tổ hợp ở mẫu mới vẫn còn hàng.
    if (
      size &&
      (findVariant(product, nextStyle.id, nextColor, size)?.stock ?? 0) === 0
    ) {
      setSize(null);
    }
    setQty(1);
  };

  const pickColor = (name: string) => {
    setColor(name);
    setError(null);
    // size đang chọn có thể không còn ở màu mới — chỉ giữ lại nếu vẫn mua được
    if (size && (findVariant(product, style.id, name, size)?.stock ?? 0) === 0) {
      setSize(null);
    }
    setQty(1);
  };

  const pickSize = (value: string) => {
    setSize(value);
    setError(null);
    setQty(1);
  };

  /** trả về true khi món hàng thực sự đã vào giỏ */
  const addToCart = (options?: { openDrawer?: boolean }) => {
    if (!size || !variant) {
      setError("Vui lòng chọn size.");
      return false;
    }
    if (variant.stock === 0) {
      setError("Tổ hợp mẫu, màu và size này đã hết hàng.");
      return false;
    }

    add(
      {
        id: variant.id,
        slug: product.slug,
        name: product.name,
        image: style.image || product.image,
        // Không gắn nhãn tự sinh vào giỏ cũ; chỉ mẫu khai thật mới hiển thị.
        styleName: product.styles?.length ? style.name : undefined,
        color,
        size,
        price,
        qty,
        stock: variant.stock,
      },
      options,
    );
    setError(null);
    return true;
  };

  /** Mua ngay: thêm vào giỏ không mở drawer và chuyển thẳng đến /checkout */
  const buyNow = () => {
    const success = addToCart({ openDrawer: false });
    if (success) {
      setIsBuying(true);
      router.push("/checkout");
    }
    return success;
  };

  return {
    styles,
    style,
    /** true khi API thật sự có mẫu; false với mẫu tương thích tự sinh. */
    hasExplicitStyles: Boolean(product.styles?.length),
    color,
    size,
    qty,
    error,
    variant,
    isBuying,
    /** giá của biến thể đang chọn, rơi về giá chung khi chưa chọn size */
    price,
    availableColors,
    availableSizes,
    stockBySize,
    styleSoldOut,
    colorSoldOut,
    isStyleSoldOut,
    isColorSoldOut,
    /** còn thêm được bao nhiêu sản phẩm của biến thể đang chọn */
    max: variant?.stock ?? 0,
    setQty,
    pickStyle,
    pickColor,
    pickSize,
    addToCart,
    buyNow,
  };
}
