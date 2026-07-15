"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { updatePickupPoint, deletePickupPoint } from "@/app/admin/pickup-points/actions";

type PickupPoint = {
  id: string;
  country: "AO" | "PT";
  name: string;
  address: string;
  city: string;
  hours: string | null;
  maps_url: string | null;
  is_active: boolean | null;
};

export function PickupPointRow({ point }: { point: PickupPoint }) {
  return (
    <form
      action={updatePickupPoint.bind(null, point.id)}
      className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto_auto] items-center gap-2 border-b p-3 last:border-0"
    >
      <select name="country" defaultValue={point.country} className="h-8 rounded-md border border-input bg-transparent px-2 text-sm">
        <option value="AO">AO</option>
        <option value="PT">PT</option>
      </select>
      <Input name="name" defaultValue={point.name} required />
      <Input name="city" defaultValue={point.city} required />
      <Input name="address" defaultValue={point.address} required />
      <Input name="hours" defaultValue={point.hours ?? ""} placeholder="Seg-Sáb 9h-18h" />
      <label className="flex items-center gap-1.5 text-xs whitespace-nowrap">
        <Checkbox name="isActive" defaultChecked={point.is_active ?? true} />
        Ativo
      </label>
      <div className="flex gap-1.5">
        <Button type="submit" size="sm" variant="outline">
          Guardar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => deletePickupPoint(point.id)}>
          Eliminar
        </Button>
      </div>
      <input type="hidden" name="mapsUrl" value={point.maps_url ?? ""} />
    </form>
  );
}
