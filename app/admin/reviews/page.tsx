import { createClient } from "@/lib/supabase/server";
import { ReviewRow } from "@/app/admin/reviews/review-row";

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, customer_name, rating, body, is_approved, admin_reply, products(name)")
    .order("created_at", { ascending: false });

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Avaliações</h1>
      {!reviews?.length ? (
        <p className="text-muted-foreground">Ainda não há avaliações.</p>
      ) : (
        <div className="flex flex-col gap-3 max-w-2xl">
          {reviews.map((review) => (
            <ReviewRow key={review.id} review={review} />
          ))}
        </div>
      )}
    </main>
  );
}
