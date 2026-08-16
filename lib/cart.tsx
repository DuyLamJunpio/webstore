"use client";

/**
 * Guest cart — no account, no login.
 *
 * The cart lives in localStorage under `tbc.cart.v1`, so it survives reloads and
 * browser restarts on the same device. A random `cartId` is written alongside it
 * and mirrored into a plain cookie, which gives the server a stable handle on the
 * visitor if the cart is ever moved to a database (guest checkout, abandoned-cart
 * email, "merge my cart" after login) without changing any of this code.
 *
 * It is modelled as an external store rather than React state: localStorage is
 * exactly that, and `useSyncExternalStore` gives us a stable empty snapshot on
 * the server so hydration never mismatches.
 */

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { FREE_SHIPPING_THRESHOLD } from "./checkout";

export type CartItem = {
  /** variant id — one line per colour + size combination */
  id: string;
  slug: string;
  name: string;
  image: string;
  color: string;
  size: string;
  price: number;
  qty: number;
  /** stock snapshot, used to cap the quantity stepper */
  stock: number;
};

type StoredCart = {
  v: 1;
  cartId: string;
  savedAt: number;
  items: CartItem[];
};

type Snapshot = {
  items: CartItem[];
  /** false until localStorage has been read — render skeletons, not a wrong count */
  hydrated: boolean;
  cartId: string | null;
  isOpen: boolean;
};

const STORAGE_KEY = "tbc.cart.v1";
const COOKIE_KEY = "tbc_cart_id";
const MAX_AGE_DAYS = 30;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

/** re-exported so cart UI keeps one import, while checkout owns the number */
export { FREE_SHIPPING_THRESHOLD };

/** stable reference — required by useSyncExternalStore's server snapshot */
const EMPTY: Snapshot = { items: [], hydrated: false, cartId: null, isOpen: false };

let snapshot: Snapshot = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function publish(patch: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((listener) => listener());
}

const isCartItem = (value: unknown): value is CartItem => {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    typeof item.qty === "number" &&
    item.qty > 0
  );
};

function newCartId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `c_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function readStored(): StoredCart | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredCart>;
    if (parsed?.v !== 1 || !Array.isArray(parsed.items)) return null;
    // drop carts nobody has touched in a month
    if (typeof parsed.savedAt !== "number" || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      v: 1,
      cartId: typeof parsed.cartId === "string" ? parsed.cartId : newCartId(),
      savedAt: parsed.savedAt,
      items: parsed.items.filter(isCartItem),
    };
  } catch {
    // private mode, quota errors, hand-edited JSON — start clean rather than crash
    return null;
  }
}

function persist(items: CartItem[], cartId: string | null) {
  if (!cartId) return;
  try {
    const payload: StoredCart = { v: 1, cartId, savedAt: Date.now(), items };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    document.cookie = `${COOKIE_KEY}=${cartId}; path=/; max-age=${MAX_AGE_DAYS * 24 * 60 * 60}; samesite=lax`;
  } catch {
    // storage full or blocked — the cart still works for this session
  }
}

/** runs once, on the first subscription (commit phase, never during render) */
function load() {
  if (loaded) return;
  loaded = true;

  const stored = readStored();
  const cartId = stored?.cartId ?? newCartId();
  persist(stored?.items ?? [], cartId);
  publish({ items: stored?.items ?? [], cartId, hydrated: true });
}

function onStorage(event: StorageEvent) {
  // another tab of the same shop changed the bag
  if (event.key !== STORAGE_KEY) return;
  const stored = readStored();
  publish({ items: stored?.items ?? [] });
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  load();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function commit(items: CartItem[], patch: Partial<Snapshot> = {}) {
  persist(items, snapshot.cartId);
  publish({ items, ...patch });
}

export const cart = {
  add(item: CartItem) {
    const existing = snapshot.items.find((line) => line.id === item.id);
    const items = existing
      ? snapshot.items.map((line) =>
          line.id === item.id
            ? { ...line, qty: Math.min(line.qty + item.qty, line.stock) }
            : line,
        )
      : [...snapshot.items, item];
    commit(items, { isOpen: true });
  },

  setQty(id: string, qty: number) {
    const items = snapshot.items.flatMap((line) => {
      if (line.id !== id) return [line];
      const next = Math.min(Math.max(qty, 0), line.stock);
      return next === 0 ? [] : [{ ...line, qty: next }];
    });
    commit(items);
  },

  remove(id: string) {
    commit(snapshot.items.filter((line) => line.id !== id));
  },

  clear() {
    commit([]);
  },

  open() {
    publish({ isOpen: true });
  },

  close() {
    publish({ isOpen: false });
  },
};

export function useCart() {
  const state = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );

  const openCart = useCallback(() => cart.open(), []);
  const closeCart = useCallback(() => cart.close(), []);
  const add = useCallback((item: CartItem) => cart.add(item), []);
  const setQty = useCallback((id: string, qty: number) => cart.setQty(id, qty), []);
  const remove = useCallback((id: string) => cart.remove(id), []);
  const clear = useCallback(() => cart.clear(), []);

  return useMemo(() => {
    const count = state.items.reduce((total, line) => total + line.qty, 0);
    const subtotal = state.items.reduce((total, line) => total + line.price * line.qty, 0);
    return { ...state, count, subtotal, openCart, closeCart, add, setQty, remove, clear };
  }, [state, openCart, closeCart, add, setQty, remove, clear]);
}
