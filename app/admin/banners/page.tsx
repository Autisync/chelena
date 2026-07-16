import { createClient } from "@/lib/supabase/server";
import { createBanner } from "@/app/admin/banners/actions";
import { BannerCard } from "@/app/admin/banners/banner-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminBannersPage() {
  const supabase = await createClient();
  const [{ data: banners }, { data: advertisableImages }] = await Promise.all([
    supabase
      .from("banners")
      .select("id, title, placement, country, is_active, product_images(storage_path_card)")
      .order("sort_order"),
    supabase
      .from("product_images")
      .select("id, storage_path_card, products(name)")
      .eq("is_advertisable", true),
  ]);

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Banners</h1>

      {!!banners?.length && (
        <div className="mb-8 grid grid-cols-3 gap-3">
          {banners.map((banner) => (
            <BannerCard key={banner.id} banner={banner} />
          ))}
        </div>
      )}

      {!advertisableImages?.length ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma imagem marcada como &ldquo;publicitável&rdquo; ainda — marque uma imagem de
          produto em Produtos → editar → Imagens antes de criar um banner.
        </p>
      ) : (
        <fieldset className="max-w-md rounded-md border p-4">
          <legend className="px-1 text-sm font-medium">Adicionar banner</legend>
          <form action={createBanner} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="imageId">Imagem</Label>
              <select
                id="imageId"
                name="imageId"
                required
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                {advertisableImages.map((image) => (
                  <option key={image.id} value={image.id}>
                    {image.products?.name ?? image.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="targetUrl">Link de destino</Label>
              <Input id="targetUrl" name="targetUrl" type="url" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="placement">Posição</Label>
              <select
                id="placement"
                name="placement"
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                <option value="home_hero">Home — hero</option>
                <option value="home_strip">Home — faixa</option>
                <option value="category_top">Categoria — topo</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">País (vazio = ambos)</Label>
              <select
                id="country"
                name="country"
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                <option value="">Ambos</option>
                <option value="AO">Angola</option>
                <option value="PT">Portugal</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked className="size-4" />
              Ativo
            </label>
            <Button type="submit" className="self-start">
              Adicionar
            </Button>
          </form>
        </fieldset>
      )}
    </main>
  );
}
