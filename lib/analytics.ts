"use client";

import { track } from "@vercel/analytics";

// Milestone 6 exit criteria: "basic event tracking (add-to-cart, checkout,
// order)". `track()` is a no-op outside Vercel's runtime (safe in local dev).
export function trackAddToCart(productId: string, productName: string) {
  track("add_to_cart", { productId, productName });
}

export function trackCheckoutStarted(itemCount: number) {
  track("checkout_started", { itemCount });
}

export function trackOrderCompleted(orderNumber: string, country: string) {
  track("order_completed", { orderNumber, country });
}
