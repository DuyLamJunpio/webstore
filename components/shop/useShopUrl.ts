"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useOptimistic, useTransition } from "react";

/**
 * Edits the shop's query string.
 *
 * The current query arrives as a prop from the server page (no `useSearchParams`,
 * so no Suspense boundary is needed). `useOptimistic` keeps checkboxes and pills
 * responding instantly while the server re-renders the filtered grid.
 */
export function useShopUrl(queryString: string) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [optimisticQuery, setOptimisticQuery] = useOptimistic(queryString);

  const params = new URLSearchParams(optimisticQuery);

  const apply = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(optimisticQuery);
      mutate(next);
      const serialised = next.toString();
      startTransition(() => {
        setOptimisticQuery(serialised);
        router.replace(serialised ? `${pathname}?${serialised}` : pathname, { scroll: false });
      });
    },
    [optimisticQuery, pathname, router, setOptimisticQuery],
  );

  const has = useCallback(
    (key: string, value: string) => params.getAll(key).includes(value),
    // params is rebuilt from optimisticQuery on every render
    [optimisticQuery], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const toggle = useCallback(
    (key: string, value: string) =>
      apply((next) => {
        const current = next.getAll(key);
        next.delete(key);
        const updated = current.includes(value)
          ? current.filter((entry) => entry !== value)
          : [...current, value];
        updated.forEach((entry) => next.append(key, entry));
      }),
    [apply],
  );

  const set = useCallback(
    (key: string, value: string | null) =>
      apply((next) => {
        next.delete(key);
        if (value) next.set(key, value);
      }),
    [apply],
  );

  const removeChip = useCallback(
    (key: string, value: string) =>
      apply((next) => {
        if (key === "price") {
          next.delete("min");
          next.delete("max");
          return;
        }
        const remaining = next.getAll(key).filter((entry) => entry !== value);
        next.delete(key);
        remaining.forEach((entry) => next.append(key, entry));
      }),
    [apply],
  );

  const clearAll = useCallback(
    () =>
      apply((next) => {
        const sort = next.get("sort");
        [...next.keys()].forEach((key) => next.delete(key));
        if (sort) next.set("sort", sort);
      }),
    [apply],
  );

  return { params, pending, apply, has, toggle, set, removeChip, clearAll };
}
