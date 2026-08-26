/**
 * Cài đặt bán hàng do trang quản trị quyết định: hình thức thanh toán nào đang
 * mở và phí giao hàng tính ra sao.
 *
 * Cố ý KHÔNG có "use client": máy chủ cũng dùng những hàm này để định giá lại
 * đơn. Đánh dấu client thì Next biến chúng thành đầu mối gọi sang trình duyệt,
 * và mọi lời gọi từ route API đều nổ.
 *
 * Trước đây phí giao hàng là hai hằng số trong `lib/checkout.ts`, muốn đổi phải
 * sửa mã rồi triển khai lại. Giờ chủ shop tự chỉnh trong trang quản trị.
 *
 * Số tiền hiển thị ở đây chỉ để khách xem trước; con số tính tiền thật vẫn do
 * máy chủ dựng lại từ cùng cấu hình này lúc đặt hàng.
 */

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

/** Tên hiển thị cho khách ở ô chọn hình thức thanh toán. */
export const TEN_PHUONG_THUC: Record<PaymentMethodKey, string> = {
  bank_transfer: "Chuyển khoản ngân hàng",
  cod: "Thanh toán khi nhận hàng",
};

export const MO_TA_PHUONG_THUC: Record<PaymentMethodKey, string> = {
  bank_transfer: "Quét mã QR ngay sau khi đặt. Đơn được xác nhận khi shop nhận được tiền.",
  cod: "Trả tiền mặt cho người giao hàng. Shop gọi xác nhận trước khi gửi đi.",
};

/** Chữ trên nút đặt hàng, đổi theo hình thức đang chọn. */
export const NHAN_NUT_DAT: Record<PaymentMethodKey, string> = {
  bank_transfer: "Tạo mã QR chuyển khoản",
  cod: "Tạo hoá đơn — trả khi nhận hàng",
};

export const NHAN_NUT_DANG_GUI: Record<PaymentMethodKey, string> = {
  bank_transfer: "Đang tạo mã QR…",
  cod: "Đang gửi đơn…",
};

/** Thứ tự bày ra cho khách; cũng là thứ tự chọn hình thức mặc định. */
export const THU_TU_PHUONG_THUC: PaymentMethodKey[] = ["bank_transfer", "cod"];

/**
 * Đơn có áo in theo yêu cầu chỉ nhận CHUYỂN KHOẢN TRƯỚC.
 *
 * Áo in là hàng làm riêng cho một người: in tên lớp lên rồi thì không bán lại
 * cho ai được nữa. Khách đổi ý và từ chối nhận một đơn trả-khi-nhận-hàng là
 * shop ôm trọn cả phôi lẫn công in. Tiền vào tài khoản cũng chính là tín hiệu
 * để shop bắt đầu duyệt file và đưa xuống xưởng.
 *
 * Luật này không nằm trong trang quản trị vì nó không phải một tuỳ chọn kinh
 * doanh — nó là điều kiện để nhận đơn in.
 */
export const PHUONG_THUC_CHO_DON_IN: PaymentMethodKey = "bank_transfer";

/**
 * Các hình thức chủ shop đang mở, giữ đúng thứ tự bày.
 *
 * Giỏ có mẫu áo in (`hasPrint`) thì chỉ còn đúng một cách trả tiền, và trang
 * thanh toán khỏi bày ra một lựa chọn mà máy chủ sẽ từ chối ngay sau đó.
 */
export const enabledMethods = (
  settings: SalesSettings,
  options: { hasPrint?: boolean } = {},
): PaymentMethodKey[] => {
  const thuTu = options.hasPrint ? [PHUONG_THUC_CHO_DON_IN] : THU_TU_PHUONG_THUC;
  return thuTu.filter((key) => settings[key]?.enabled);
};

/**
 * Hình thức chọn sẵn khi mở trang thanh toán, và cũng là hình thức dùng để ước
 * lượng phí giao hàng ở giỏ — lúc đó khách chưa chọn gì.
 *
 * Tắt hết thì trả về chuyển khoản: máy chủ vẫn chặn đơn, nhưng giao diện không
 * được phép vỡ vì thiếu giá trị.
 */
export const defaultMethod = (
  settings: SalesSettings,
  options: { hasPrint?: boolean } = {},
): PaymentMethodKey => enabledMethods(settings, options)[0] ?? PHUONG_THUC_CHO_DON_IN;
