"use client";

/**
 * Đưa cài đặt bán hàng xuống các thành phần chạy trong trình duyệt.
 *
 * Tách khỏi `lib/sales.ts` vì file này phải là "use client" (nó dùng context),
 * còn các phép tính tiền trong đó thì máy chủ cũng gọi.
 */

import { createContext, useContext, type ReactNode } from "react";

import { SALES_MAC_DINH, type SalesSettings } from "./sales";

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
