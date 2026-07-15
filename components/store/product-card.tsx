import Link from "next/link";
import Image from "next/image";
import { productImageUrl } from "@/lib/images/url";
import { formatMoney } from "@/lib/currency";

type ProductCardData = {
  slug: string;
  name: string;
  brand: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  stock: number;
  imagePath: string | null;
  imageAlt: string | null;
};

export function ProductCard({
  product,
  locale,
}: {
  product: ProductCardData;
  locale: string;
}) {
  const outOfStock = product.stock <= 0;

  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className="group flex flex-col gap-2"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        {product.imagePath ? (
          <Image
            src={productImageUrl(product.imagePath)}
            alt={product.imageAlt ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Sem imagem
          </div>
        )}
        {outOfStock && (
          <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Esgotado
          </span>
        )}
      </div>
      <div className="flex flex-col">
        {product.brand && <span className="text-xs text-muted-foreground">{product.brand}</span>}
        <span className="text-sm font-medium">{product.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm">{formatMoney(product.price, product.currency, locale)}</span>
          {product.compareAtPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatMoney(product.compareAtPrice, product.currency, locale)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
