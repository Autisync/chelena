"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setReviewApproved, replyToReview } from "@/app/admin/reviews/actions";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  body: string | null;
  is_approved: boolean | null;
  admin_reply: string | null;
  products: { name: string } | null;
};

export function ReviewRow({ review }: { review: Review }) {
  const [reply, setReply] = useState(review.admin_reply ?? "");
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    await setReviewApproved(review.id, !review.is_approved);
    setPending(false);
  }

  async function saveReply() {
    setPending(true);
    await replyToReview(review.id, reply);
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium">{review.customer_name}</span>
          <span className="ml-2 text-accent">{"★".repeat(review.rating)}</span>
          <span className="ml-2 text-xs text-muted-foreground">{review.products?.name}</span>
        </div>
        <span
          className={
            review.is_approved
              ? "rounded-full bg-success/15 px-2 py-0.5 text-xs text-success"
              : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          }
        >
          {review.is_approved ? "Aprovada" : "Pendente"}
        </span>
      </div>
      {review.body && <p className="text-sm text-muted-foreground">{review.body}</p>}
      <div className="flex items-center gap-2">
        <Button size="sm" variant={review.is_approved ? "outline" : "default"} disabled={pending} onClick={toggle}>
          {review.is_approved ? "Ocultar" : "Aprovar"}
        </Button>
        <Input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Resposta (opcional)"
          className="h-8 flex-1"
        />
        <Button size="sm" variant="ghost" disabled={pending} onClick={saveReply}>
          Guardar
        </Button>
      </div>
    </div>
  );
}
