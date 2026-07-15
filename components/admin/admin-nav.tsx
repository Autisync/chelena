"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Produtos" },
  { href: "/admin/orders", label: "Encomendas" },
  { href: "/admin/pickup-points", label: "Pontos de levantamento" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/reviews", label: "Avaliações" },
  { href: "/admin/settings", label: "Definições" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r bg-background p-4">
      <span className="mb-2 px-2 text-sm font-semibold">Chelena Admin</span>
      {LINKS.map((link) => {
        const active = link.href === "/admin" ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-2 py-1.5 text-sm transition-colors",
              active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
