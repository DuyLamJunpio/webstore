"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Product } from "@/lib/data";
import { useVariantSelection } from "@/lib/useVariantSelection";

type VariantSelectionContextValue = ReturnType<typeof useVariantSelection>;

const VariantSelectionContext = createContext<VariantSelectionContextValue | null>(null);

/**
 * Một bộ chọn dùng chung cho gallery, form mua và thanh mua nhanh của trang chi tiết.
 * Quick Add tự tạo bộ chọn riêng vì mỗi dialog là một phiên lựa chọn độc lập.
 */
export default function VariantSelectionProvider({
  product,
  children,
}: {
  product: Product;
  children: ReactNode;
}) {
  const value = useVariantSelection(product);
  return (
    <VariantSelectionContext.Provider value={value}>
      {children}
    </VariantSelectionContext.Provider>
  );
}

export function useSharedVariantSelection() {
  const value = useContext(VariantSelectionContext);
  if (!value) {
    throw new Error("useSharedVariantSelection phải nằm trong VariantSelectionProvider.");
  }
  return value;
}
