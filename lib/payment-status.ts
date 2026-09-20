/** Status values stored with a bank-transfer order, independent of any provider. */
export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "UNDERPAID"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED";
