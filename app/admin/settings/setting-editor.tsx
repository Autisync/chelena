"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateSetting } from "@/app/admin/settings/actions";

export function SettingEditor({ settingKey, label, value }: { settingKey: string; label: string; value: unknown }) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("value", text);
    try {
      await updateSetting(settingKey, formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro");
    }
    setPending(false);
  }

  return (
    <fieldset className="flex flex-col gap-2 rounded-md border p-4">
      <legend className="px-1 text-sm font-medium">{label}</legend>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        className="font-mono text-xs"
      />
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={save}>
          {pending ? "A guardar…" : "Guardar"}
        </Button>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    </fieldset>
  );
}
