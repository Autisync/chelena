import { Inter, Fraunces } from "next/font/google";

// See DESIGN.md "Typography" — Fraunces for display/headings (storefront only),
// Inter for body/UI everywhere (including admin, which uses no display font).
export const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
export const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});
