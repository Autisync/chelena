import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { geistSans, geistMono } from "@/lib/fonts";
import { createClient } from "@/lib/supabase/server";
import "../globals.css";

export const metadata: Metadata = { title: { default: "Admin | Chelena", template: "%s | Chelena Admin" } };

// Role guard (defense in depth — RLS + is_admin() is the real enforcement
// per hard rule #3; this just gives non-admins a redirect instead of a
// confusing empty page).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/pt/account/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/pt");

  return (
    <html lang="pt" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-muted/30">{children}</body>
    </html>
  );
}
