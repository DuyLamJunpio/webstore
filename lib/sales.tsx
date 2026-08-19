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

/** Tên hiển thị cho khách, dùng chung ở trang thanh toán và trong thư xác nhận. */
export const TEN_PHUONG_THUC: Record<PaymentMethodKey, string> = {
  bank_transfer: "Chuyển khoản ngân hàng",
  cod: "Thanh toán khi nhận hàng",
};

export const MO_TA_PHUONG_THUC: Record<PaymentMethodKey, string> = {
  bank_transfer: "Quét mã QR ngay sau khi đặt. Đơn được xác nhận khi shop nhận được tiền.",
  cod: "Trả tiền mặt cho người giao hàng. Shop sẽ gọi xác nhận trước khi gửi đi.",
};

/** Thứ tự bày ra cho khách; cũng là thứ tự chọn hình thức mặc định. */
export const THU_TU_PHUONG_THUC: PaymentMethodKey[] = ["bank_transfer", "cod"];

/** Các hình thức chủ shop đang mở, giữ đúng thứ tự bày. */
export const enabledMethods = (settings: SalesSettings): PaymentMethodKey[] =>
  THU_TU_PHUONG_THUC.filter((key) => settings[key]?.enabled);

/**
 * Hình thức chọn sẵn khi mở trang thanh toán, và cũng là hình thức dùng để ước
 * lượng phí giao hàng ở giỏ — lúc đó khách chưa chọn gì.
 *
 * Tắt hết thì trả về chuyển khoản: máy chủ vẫn chặn đơn, nhưng giao diện không
 * được phép vỡ vì thiếu giá trị.
 */
export const defaultMethod = (settings: SalesSettings): PaymentMethodKey =>
  enabledMethods(settings)[0] ?? "bank_transfer";

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
