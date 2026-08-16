"use client";

import { useEffect } from "react";
import { cart } from "@/lib/cart";

/**
 * Empties the bag once an order is actually paid — not when it is created.
 *
 * Keeping the cart until the money arrives means a cancelled or expired QR
 * leaves the shopper exactly where they were, with everything still in it.
 */
export default function ClearCartOnPaid() {
  useEffect(() => cart.clear(), []);
  return null;
}
