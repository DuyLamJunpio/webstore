/** Voucher data comes from Warehouse; this storefront must not invent promotions. */
export type VoucherType = "percentage" | "fixed_amount" | "free_shipping";

export type Voucher = {
  code: string;
  name: string;
  description: string;
  type: VoucherType;
  value: number;
  minOrder: number;
  maxDiscount?: number;
};

export type VoucherQuote = {
  voucher: Voucher;
  discount: number;
  newShipping: number;
  message: string;
};
