import type { CartItem, CartState } from "@/lib/cart/types";
import type { Country } from "@/lib/country";

const STORAGE_KEY = "chelena_cart";
const EMPTY_STATE: CartState = { country: null, items: [] };

let state: CartState = EMPTY_STATE;
let hydrated = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Lazily hydrated from localStorage on first client read (module-level
// external store, same pattern as lib/country's cookie read) — avoids a
// useState+useEffect hydration flash and keeps this framework-agnostic.
function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      state = JSON.parse(raw) as CartState;
    } catch {
      state = EMPTY_STATE;
    }
  }
}

export function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getSnapshot(): CartState {
  ensureHydrated();
  return state;
}

export function getServerSnapshot(): CartState {
  return EMPTY_STATE;
}

// Cart is locked to one country (PRD) — adding a product from a different
// country than the current cart replaces the cart's country and clears
// incompatible items. The confirm-dialog UX for that lives in the calling
// component (components/store/country-switcher.tsx), not here — this module
// just enforces the invariant so it can never be violated by a code path
// that forgets to check.
export function addItem(item: CartItem, country: Country) {
  ensureHydrated();
  const sameCountry = state.country === country;
  const items = sameCountry ? [...state.items] : [];
  const existing = items.find((i) => i.productId === item.productId);

  if (existing) {
    existing.quantity = Math.min(existing.quantity + item.quantity, existing.stock);
  } else {
    items.push(item);
  }

  state = { country, items };
  persist();
  notify();
}

export function updateQuantity(productId: string, quantity: number) {
  ensureHydrated();
  const items = state.items
    .map((item) => (item.productId === productId ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0);
  state = { ...state, items, country: items.length ? state.country : null };
  persist();
  notify();
}

export function removeItem(productId: string) {
  updateQuantity(productId, 0);
}

export function clearCart() {
  ensureHydrated();
  state = EMPTY_STATE;
  persist();
  notify();
}
