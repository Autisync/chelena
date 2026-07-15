import type { Country } from "@/lib/country";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  imagePath: string | null;
  stock: number;
};

export type CartState = {
  country: Country | null;
  items: CartItem[];
};
