export type VoucherType = "percent" | "fixed" | "free_shipping";

export type Voucher = {
  code: string;
  description: string;
  type: VoucherType;
  value: number; // Tỉ lệ % (ví dụ 25) hoặc số tiền (ví dụ 50000)
  minOrder?: number;
  maxDiscount?: number;
};

export const AVAILABLE_VOUCHERS: Record<string, Voucher> = {
  EXTRA25: {
    code: "EXTRA25",
    description: "Giảm thêm 25% trên giá trị đơn hàng",
    type: "percent",
    value: 25,
  },
  SALE50: {
    code: "SALE50",
    description: "Ưu đãi giảm 50% đơn hàng",
    type: "percent",
    value: 50,
  },
  UPTO50: {
    code: "UPTO50",
    description: "Ưu đãi giảm 50% đơn hàng",
    type: "percent",
    value: 50,
  },
  TBC10: {
    code: "TBC10",
    description: "Giảm 10% tri ân khách hàng",
    type: "percent",
    value: 10,
  },
  FREESHIP: {
    code: "FREESHIP",
    description: "Miễn phí vận chuyển toàn quốc",
    type: "free_shipping",
    value: 0,
  },
  GIAM50K: {
    code: "GIAM50K",
    description: "Giảm 50.000₫ cho đơn từ 200.000₫",
    type: "fixed",
    value: 50000,
    minOrder: 200000,
  },
};

export type VoucherResult =
  | {
      ok: true;
      voucher: Voucher;
      discount: number;
      newShipping: number;
      message: string;
    }
  | {
      ok: false;
      error: string;
    };

export function checkVoucher(
  rawCode: string | undefined | null,
  subtotal: number,
  shipping: number,
): VoucherResult {
  if (!rawCode) {
    return { ok: false, error: "Vui lòng nhập mã giảm giá." };
  }

  const code = rawCode.trim().toUpperCase();
  const voucher = AVAILABLE_VOUCHERS[code];

  if (!voucher) {
    return {
      ok: false,
      error: "Mã giảm giá không hợp lệ hoặc đã hết hạn.",
    };
  }

  if (voucher.minOrder && subtotal < voucher.minOrder) {
    return {
      ok: false,
      error: `Mã ${voucher.code} chỉ áp dụng cho đơn hàng từ ${new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(voucher.minOrder)}.`,
    };
  }

  let discount = 0;
  let newShipping = shipping;

  if (voucher.type === "percent") {
    discount = Math.round((subtotal * voucher.value) / 100);
    if (voucher.maxDiscount) {
      discount = Math.min(discount, voucher.maxDiscount);
    }
    discount = Math.min(discount, subtotal);
  } else if (voucher.type === "fixed") {
    discount = Math.min(voucher.value, subtotal);
  } else if (voucher.type === "free_shipping") {
    discount = 0;
    newShipping = 0;
  }

  return {
    ok: true,
    voucher,
    discount,
    newShipping,
    message: `Đã áp dụng mã ${voucher.code}: ${voucher.description}`,
  };
}
