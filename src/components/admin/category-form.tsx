"use client";

import { Loader2, Save } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { saveCategoryAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils";
import type { ActionState } from "@/types/commerce";

const initialState: ActionState = { ok: false };

export type CategoryDraft = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

export function CategoryForm({ category }: { category: CategoryDraft | null }) {
  const [state, formAction, isPending] = useActionState(saveCategoryAction, initialState);
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  // Derived instead of synced in an effect: until the admin edits the slug it
  // simply mirrors the name.
  const effectiveSlug = slugTouched ? slug : slugify(name);

  useEffect(() => {
    if (state.message && !state.ok) toast.error(state.message);
  }, [state]);

  const fieldError = (key: string) => state.fieldErrors?.[key]?.[0];

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="categoryId" value={category?.id ?? ""} />

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-stone-900">
          {category ? `Edit “${category.name}”` : "Add a category"}
        </h2>
        {category ? (
          <a
            href="/admin/categories"
            className="text-xs font-semibold text-stone-500 hover:text-stone-900"
          >
            Cancel edit
          </a>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="category-name">Name</Label>
          <Input
            id="category-name"
            name="name"
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1.5"
          />
          {fieldError("name") ? <p className="field-error">{fieldError("name")}</p> : null}
        </div>

        <div>
          <Label htmlFor="category-slug">Slug</Label>
          <Input
            id="category-slug"
            name="slug"
            required
            maxLength={140}
            value={effectiveSlug}
            onChange={(event) => {
              setSlug(event.target.value);
              setSlugTouched(true);
            }}
            className="mt-1.5 font-mono text-xs"
          />
          {fieldError("slug") ? <p className="field-error">{fieldError("slug")}</p> : null}
          <p className="mt-1 text-[10px] text-muted-foreground">/category/{effectiveSlug || "slug"}</p>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="category-description">Description</Label>
          <Textarea
            id="category-description"
            name="description"
            rows={3}
            maxLength={1000}
            defaultValue={category?.description ?? ""}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="category-image">Image URL</Label>
          <Input
            id="category-image"
            name="imageUrl"
            maxLength={1000}
            defaultValue={category?.imageUrl ?? ""}
            placeholder="/categories/lawn.webp"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="category-order">Sort order</Label>
          <Input
            id="category-order"
            name="sortOrder"
            type="number"
            min={0}
            max={999}
            defaultValue={category?.sortOrder ?? 0}
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="isActive" defaultChecked={category ? category.isActive : true} />
          <span className="text-stone-700">Visible in the store</span>
        </label>

        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {isPending ? "Saving…" : category ? "Save category" : "Create category"}
        </Button>
      </div>
    </form>
  );
}
