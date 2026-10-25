"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { submitReviewAction } from "@/actions/reviews";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/types/commerce";

const initialState: ActionState = { ok: false };

export function ReviewForm({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState(submitReviewAction, initialState);
  const [rating, setRating] = useState(5);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Thank you for your review.");
      formRef.current?.reset();
      // The server accepted the review, so return the widget to its default.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRating(5);
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="rounded-2xl border border-border bg-white p-5">
      <input type="hidden" name="productId" value={productId} />
      <h3 className="font-display text-xl text-stone-900">Write a review</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Share how the fabric, fit and finish felt in person.
      </p>

      <fieldset className="mt-4">
        <legend className="field-label">Your rating</legend>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className="cursor-pointer rounded p-0.5 focus-within:ring-2 focus-within:ring-ring"
            >
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              <Star
                className={cn(
                  "size-6 transition-colors",
                  value <= rating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-stone-200 text-stone-200",
                )}
                aria-hidden="true"
              />
              <span className="sr-only">{value} stars</span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.rating ? (
          <p className="field-error">{state.fieldErrors.rating[0]}</p>
        ) : null}
      </fieldset>

      <div className="mt-4">
        <Label htmlFor="review-title">Title (optional)</Label>
        <Input
          id="review-title"
          name="title"
          maxLength={140}
          placeholder="Beautiful embroidery, true to colour"
          className="mt-1.5"
        />
        {state.fieldErrors?.title ? (
          <p className="field-error">{state.fieldErrors.title[0]}</p>
        ) : null}
      </div>

      <div className="mt-4">
        <Label htmlFor="review-body">Your review</Label>
        <Textarea
          id="review-body"
          name="body"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          placeholder="Tell other customers about the fabric, fit and finish…"
          className="mt-1.5"
        />
        {state.fieldErrors?.body ? (
          <p className="field-error">{state.fieldErrors.body[0]}</p>
        ) : null}
      </div>

      <Button type="submit" className="mt-4" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        {isPending ? "Publishing…" : "Publish review"}
      </Button>
    </form>
  );
}
