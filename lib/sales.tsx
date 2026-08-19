"use client";

/**
 * Cài đặt bán hàng do trang quản trị quyết định: hình thức thanh toán nào đang
 * mở và phí giao hàng tính ra sao.
 *
 * Trước đây phí giao hàng là hai hằng số trong `lib/checkout.ts`, muốn đổi phải
 * sửa mã rồi triển khai lại. Giờ chủ shop tự chỉnh trong trang quản trị.
 *
 * Số tiền hiển thị ở đây chỉ để khách xem trước; con số tính tiền thật vẫn do
 * máy chủ dựng lại từ cùng cấu hình này lúc đặt hàng.
 */

import { createContext, useContext, type ReactNode } from "react";

export type PaymentMethodKey = "bank_transfer" | "cod";

export type SalesMethod = {
  enabled: boolean;
  freeShipping: boolean;
  /** đồng, phí khách phải trả khi không được miễn */
  shippingFee: number;
  /** mua từ ngần này món trở lên thì miễn phí; null = không áp dụng */
  freeShippingMinItems: number | null;
};

export type SalesSettings = Record<PaymentMethodKey, SalesMethod>;

/**
 * Dùng khi chưa gọi được trang quản trị. Miễn phí giao hàng — giống hệt mặc
 * định bên quản trị, để hai bên không bao giờ báo cho khách hai con số khác nhau.
 */
export const SALES_MAC_DINH: SalesSettings = {
  bank_transfer: { enabled: true, freeShipping: true, shippingFee: 0, freeShippingMinItems: null },
  cod: { enabled: true, freeShipping: true, shippingFee: 0, freeShippingMinItems: null },
};

/**
 * Phí giao hàng cho một giỏ, tính theo SỐ MÓN chứ không theo giá trị đơn:
 * ngưỡng miễn phí bên quản trị khai bằng số sản phẩm.
 */
export function shippingFeeFor(
  settings: SalesSettings,
  method: PaymentMethodKey,
  itemCount: number,
): number {
  const config = settings[method];
  if (!config || config.freeShipping) return 0;

  const threshold = config.freeShippingMinItems;
  if (threshold !== null && itemCount >= threshold) return 0;

  return Math.max(0, config.shippingFee);
}

/** Còn thiếu bao nhiêu món nữa thì được miễn phí giao hàng; 0 = đã miễn rồi. */
export function itemsToFreeShipping(
  settings: SalesSettings,
  method: PaymentMethodKey,
  itemCount: number,
): number {
  const config = settings[method];
  if (!config || config.freeShipping || config.freeShippingMinItems === null) return 0;

  return Math.max(0, config.freeShippingMinItems - itemCount);
}

const SalesContext = createContext<SalesSettings>(SALES_MAC_DINH);

export function SalesProvider({
  value,
  children,
}: {
  value: SalesSettings;
  children: ReactNode;
}) {
  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
}

export const useSales = () => useContext(SalesContext);
