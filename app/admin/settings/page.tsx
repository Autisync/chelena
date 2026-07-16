import { createClient } from "@/lib/supabase/server";
import { SettingEditor } from "@/app/admin/settings/setting-editor";

const KEYS: { key: string; label: string; defaultValue: unknown }[] = [
  { key: "whatsapp_numbers", label: "Números WhatsApp (por país)", defaultValue: { AO: null, PT: null } },
  {
    key: "payment_templates",
    label: "Modelos de instruções de pagamento (por país)",
    defaultValue: { AO: "", PT: "" },
  },
  { key: "google_place_id", label: "Google Place ID", defaultValue: null },
];

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from("settings").select("key, value");
  const byKey = new Map((rows ?? []).map((r) => [r.key, r.value]));

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Definições</h1>
      <div className="flex max-w-xl flex-col gap-4">
        {KEYS.map((k) => (
          <SettingEditor
            key={k.key}
            settingKey={k.key}
            label={k.label}
            value={byKey.has(k.key) ? byKey.get(k.key) : k.defaultValue}
          />
        ))}
      </div>
    </main>
  );
}
