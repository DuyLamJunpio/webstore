"use client";

/**
 * Các mẫu áo in khách đã chốt, đang chờ mang sang trang thanh toán.
 *
 * NHIỀU mẫu, không phải một: mỗi mẫu là một món trong giỏ, y như mua quần áo.
 * Khách dựng xong một mẫu thì thêm vào giỏ rồi dựng tiếp mẫu khác — đơn áo lớp
 * có người mặc M người mặc XL thì đó là hai mẫu cùng một hình.
 *
 * Để trong localStorage chứ không nhét vào giỏ hàng thường: giỏ hàng là danh
 * sách biến thể có trong catalogue, còn mẫu in không phải một trong số đó. Trộn
 * vào là mọi chỗ đọc giỏ hàng phải học thêm một trường hợp ngoại lệ.
 *
 * Bản lưu ở đây CHỈ ĐỂ HIỆN. Lúc chốt đơn, máy chủ đọc lại từng mẫu từ trang
 * quản trị theo mã và lấy giá đã đóng băng ở đó — sửa con số trong localStorage
 * không mua rẻ được đồng nào.
 *
 * Dựng theo kiểu external store giống `lib/cart.tsx`: localStorage đúng là một
 * kho ngoài, và `useSyncExternalStore` cho một ảnh chụp rỗng ổn định phía máy
 * chủ nên không bao giờ lệch lúc hydrate.
 */

import { useSyncExternalStore } from "react";

export const PRINT_DRAFT_KEY = "tbc.print.v2";

export type PrintDraft = {
  code: string;
  label: string;
  qty: number;
  unitPrice: number;
  total: number;
  thumbUrl: string | null;
  leadDays: number;
};

/** Trần số mẫu trong một đơn, khớp với luật `max:20` bên trang quản trị. */
const MAX_DRAFTS = 20;

const listeners = new Set<() => void>();

/** Tham chiếu ổn định — bắt buộc với ảnh chụp phía máy chủ. */
const EMPTY: PrintDraft[] = [];

let snapshot: PrintDraft[] = EMPTY;
let loaded = false;

const isDraft = (value: unknown): value is PrintDraft =>
  !!value && typeof (value as PrintDraft).code === "string" && !!(value as PrintDraft).code;

function read(): PrintDraft[] {
  try {
    const raw = window.localStorage.getItem(PRINT_DRAFT_KEY);
    if (!raw) return EMPTY;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;

    const clean = parsed.filter(isDraft).slice(0, MAX_DRAFTS);
    return clean.length ? clean : EMPTY;
  } catch {
    return EMPTY;
  }
}

function write(next: PrintDraft[]) {
  try {
    if (next.length) window.localStorage.setItem(PRINT_DRAFT_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(PRINT_DRAFT_KEY);
  } catch {
    // Trình duyệt chặn lưu (chế độ riêng tư): vẫn cho đi tiếp trong phiên này.
  }

  loaded = true;
  snapshot = next.length ? next : EMPTY;
  listeners.forEach((listener) => listener());
}

const current = () => {
  if (!loaded) {
    loaded = true;
    snapshot = read();
  }
  return snapshot;
};

/** Thêm một mẫu vào giỏ. Cùng mã thì ghi đè thay vì nhân đôi. */
export function addPrintDraft(draft: PrintDraft) {
  const rest = current().filter((d) => d.code !== draft.code);
  write([...rest, draft].slice(-MAX_DRAFTS));
}

export function removePrintDraft(code: string) {
  write(current().filter((d) => d.code !== code));
}

export function clearPrintDrafts() {
  write([]);
}

export function printDraftQty(drafts: PrintDraft[]): number {
  return drafts.reduce((sum, draft) => sum + draft.qty, 0);
}

export function printDraftTotal(drafts: PrintDraft[]): number {
  return drafts.reduce((sum, draft) => sum + draft.total, 0);
}

export function usePrintDrafts(): PrintDraft[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    current,
    () => EMPTY,
  );
}
