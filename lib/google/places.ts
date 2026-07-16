import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const CACHE_KEY = "google_places_cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type PlacesCache = {
  rating: number;
  userRatingCount: number;
  reviews: { authorName: string; text: string; rating: number }[];
  fetchedAt: string;
};

// Degrades gracefully by design (PRD open question: "Google Business Profile
// exists? No — feature degrades gracefully if absent") — returns null
// whenever the place id or API key is missing, or the fetch fails, rather
// than throwing and breaking the page that renders it.
export async function getGooglePlacesRating(): Promise<PlacesCache | null> {
  const supabase = createAdminClient();

  const { data: placeIdRow } = await supabase.from("settings").select("value").eq("key", "google_place_id").maybeSingle();
  const placeId = typeof placeIdRow?.value === "string" ? placeIdRow.value : null;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!placeId || !apiKey) return null;

  const { data: cacheRow } = await supabase.from("settings").select("value").eq("key", CACHE_KEY).maybeSingle();
  const cached = cacheRow?.value as PlacesCache | undefined;
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_TTL_MS) {
    return cached;
  }

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=rating,userRatingCount,reviews`,
      { headers: { "X-Goog-Api-Key": apiKey } }
    );
    if (!res.ok) return cached ?? null;
    const body = await res.json();

    const fresh: PlacesCache = {
      rating: body.rating ?? 0,
      userRatingCount: body.userRatingCount ?? 0,
      reviews: (body.reviews ?? []).slice(0, 3).map((r: { authorAttribution?: { displayName?: string }; text?: { text?: string }; rating?: number }) => ({
        authorName: r.authorAttribution?.displayName ?? "",
        text: r.text?.text ?? "",
        rating: r.rating ?? 0,
      })),
      fetchedAt: new Date().toISOString(),
    };

    await supabase.from("settings").upsert({ key: CACHE_KEY, value: fresh });
    return fresh;
  } catch {
    return cached ?? null;
  }
}
