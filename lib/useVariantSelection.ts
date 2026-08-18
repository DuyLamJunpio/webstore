"use client";

import { useMemo, useState } from "react";
import { useCart } from "./cart";
import { findVariant, type Product } from "./data";

export const LOW_STOCK = 4;

/**
 * Toàn bộ những gì cần để chọn màu + size + số lượng rồi cho vào giỏ.
 * Dùng chung cho trang chi tiết và bảng thêm nhanh, nên hai nơi không bao giờ
 * hiểu khác nhau về việc món nào còn bán được.
 */
export function useVariantSelection(product: Product) {
  const { add } = useCart();

  // bắt đầu ở màu đầu tiên vẫn còn hàng ở đâu đó
  const initialColor =
    product.colors.find((color) =>
      product.variants.some((v) => v.color === color.name && v.stock > 0),
    ) ?? product.colors[0];

  const [color, setColor] = useState(initialColor.name);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const stockBySize = useMemo(
    () =>
      Object.fromEntries(
        product.sizes.map((s) => [s, findVariant(product, color, s)?.stock ?? 0]),
      ) as Record<string, number>,
    [product, color],
  );

  const variant = size ? findVariant(product, color, size) : undefined;

  /**
   * Giá hiện lên và giá vào giỏ phải là giá của biến thể đang chọn: bên quản trị
   * cho đặt "giá riêng" cho từng size/màu, lấy giá chung là bán sai tiền.
   * Chưa chọn size thì chưa biết biến thể nào, tạm hiện giá chung.
   */
  const price = variant?.price ?? product.price;
  const colorSoldOut = product.sizes.every((s) => stockBySize[s] === 0);

  const isColorSoldOut = (name: string) =>
    !product.variants.some((v) => v.color === name && v.stock > 0);

  const pickColor = (name: string) => {
    setColor(name);
    setError(null);
    // size đang chọn có thể không còn ở màu mới — chỉ giữ lại nếu vẫn mua được
    if (size && (findVariant(product, name, size)?.stock ?? 0) === 0) setSize(null);
    setQty(1);
  };

  const pickSize = (value: string) => {
    setSize(value);
    setError(null);
    setQty(1);
  };

  /** trả về true khi món hàng thực sự đã vào giỏ */
  const addToCart = () => {
    if (!size || !variant) {
      setError("Vui lòng chọn size.");
      return false;
    }
    if (variant.stock === 0) {
      setError("Size này đã hết hàng ở màu bạn chọn.");
      return false;
    }

    add({
      id: variant.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      color,
      size,
      price,
      qty,
      stock: variant.stock,
    });
    setError(null);
    return true;
  };

  return {
    color,
    size,
    qty,
    error,
    variant,
    /** giá của biến thể đang chọn, rơi về giá chung khi chưa chọn size */
    price,
    stockBySize,
    colorSoldOut,
    isColorSoldOut,
    /** còn thêm được bao nhiêu sản phẩm của biến thể đang chọn */
    max: variant?.stock ?? 0,
    setQty,
    pickColor,
    pickSize,
    addToCart,
  };
}
