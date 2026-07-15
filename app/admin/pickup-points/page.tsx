import { createClient } from "@/lib/supabase/server";
import { createPickupPoint } from "@/app/admin/pickup-points/actions";
import { PickupPointRow } from "@/app/admin/pickup-points/pickup-point-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function PickupPointsPage() {
  const supabase = await createClient();
  const { data: points } = await supabase
    .from("pickup_points")
    .select("*")
    .order("country")
    .order("name");

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Pontos de levantamento</h1>

      {!!points?.length && (
        <div className="mb-8 overflow-hidden rounded-md border bg-background">
          {points.map((point) => (
            <PickupPointRow key={point.id} point={point} />
          ))}
        </div>
      )}

      <fieldset className="max-w-xl rounded-md border p-4">
        <legend className="px-1 text-sm font-medium">Adicionar ponto de levantamento</legend>
        <form action={createPickupPoint} className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="country">País</Label>
            <select id="country" name="country" className="h-8 rounded-md border border-input bg-transparent px-2 text-sm">
              <option value="AO">Angola</option>
              <option value="PT">Portugal</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" name="city" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hours">Horário</Label>
            <Input id="hours" name="hours" placeholder="Seg-Sáb 9h-18h" />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="address">Morada</Label>
            <Input id="address" name="address" required />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="mapsUrl">Link Google Maps (opcional)</Label>
            <Input id="mapsUrl" name="mapsUrl" type="url" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked className="size-4" />
            Ativo
          </label>
          <Button type="submit" className="col-span-2 self-start">
            Adicionar
          </Button>
        </form>
      </fieldset>
    </main>
  );
}
