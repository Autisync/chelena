"use client";

import { useSyncExternalStore } from "react";
import * as cartStore from "@/lib/cart/store";

export function useCart() {
  const state = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot
  );

  return {
    ...state,
    itemCount: state.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem: cartStore.addItem,
    updateQuantity: cartStore.updateQuantity,
    removeItem: cartStore.removeItem,
    clearCart: cartStore.clearCart,
  };
}
