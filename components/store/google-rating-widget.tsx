import { getGooglePlacesRating } from "@/lib/google/places";

// Server component, awaited directly in the page (not a client island) —
// this reads from `settings` via the admin client (service role, no
// cookies), so it doesn't force the page dynamic the way lib/supabase/
// server.ts would. Renders nothing when there's no Google Business Profile
// configured (PRD: "degrades gracefully if absent").
export async function GoogleRatingWidget() {
  const rating = await getGooglePlacesRating();
  if (!rating) return null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-accent">★</span>
        <span className="font-medium">{rating.rating.toFixed(1)}</span>
        <span className="text-muted-foreground">no Google ({rating.userRatingCount} avaliações)</span>
      </div>
    </div>
  );
}
