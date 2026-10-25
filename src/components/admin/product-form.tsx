"use client";

import { ImagePlus, Link2, Loader2, Plus, Star, Trash2, Upload, Wand2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { saveProductAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminProductDetail } from "@/db/queries/admin";
import { slugify } from "@/lib/utils";
import type { ActionState } from "@/types/commerce";

const initialState: ActionState = { ok: false };

type VariantDraft = {
  key: string;
  id?: string;
  size: string;
  color: string;
  sku: string;
  price: string;
  stock: string;
  lowStockThreshold: string;
};

type ImageDraft = {
  key: string;
  id?: string;
  url: string;
  alt: string;
  isPrimary: boolean;
};

function makeKey() {
  return Math.random().toString(36).slice(2, 10);
}

function colorCode(color: string) {
  return color
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);
}

function toVariants(product: AdminProductDetail | null): VariantDraft[] {
  if (!product) {
    return [
      {
        key: makeKey(),
        size: "M",
        color: "Ivory",
        sku: "",
        price: "",
        stock: "10",
        lowStockThreshold: "5",
      },
    ];
  }

  return product.variants.map((variant) => ({
    key: variant.id,
    id: variant.id,
    size: variant.size,
    color: variant.color,
    sku: variant.sku,
    price: variant.price === null ? "" : String(variant.price),
    stock: String(variant.stock),
    lowStockThreshold: String(variant.lowStockThreshold),
  }));
}

function toImages(product: AdminProductDetail | null): ImageDraft[] {
  if (!product) return [];
  return product.images.map((image) => ({
    key: image.id,
    id: image.id,
    url: image.url,
    alt: image.alt ?? "",
    isPrimary: image.isPrimary,
  }));
}

export function ProductForm({
  product,
  categories,
  cloudinaryCloudName,
  cloudinaryPreset,
}: {
  product: AdminProductDetail | null;
  categories: { id: string; name: string }[];
  cloudinaryCloudName: string;
  cloudinaryPreset: string;
}) {
  const [state, formAction, isPending] = useActionState(saveProductAction, initialState);
  const [variants, setVariants] = useState<VariantDraft[]>(() => toVariants(product));
  const [images, setImages] = useState<ImageDraft[]>(() => toImages(product));
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  // Derived instead of synced in an effect: until the admin edits the slug it
  // simply mirrors the name.
  const effectiveSlug = slugTouched ? slug : slugify(name);
  const [baseSku, setBaseSku] = useState(product?.sku ?? "");
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  const variantPayload = variants.map((variant) => ({
    ...(variant.id ? { id: variant.id } : {}),
    size: variant.size,
    color: variant.color,
    sku: variant.sku,
    price: variant.price === "" ? null : Number(variant.price),
    stock: Number(variant.stock || 0),
    lowStockThreshold: Number(variant.lowStockThreshold || 0),
  }));

  const imagePayload = images.map((image) => ({
    ...(image.id ? { id: image.id } : {}),
    url: image.url,
    alt: image.alt || undefined,
    isPrimary: image.isPrimary,
  }));

  function updateVariant(key: string, patch: Partial<VariantDraft>) {
    setVariants((current) =>
      current.map((variant) => (variant.key === key ? { ...variant, ...patch } : variant)),
    );
  }

  function addVariant() {
    const color = variants.at(-1)?.color ?? "Ivory";
    const size = "M";
    setVariants((current) => [
      ...current,
      {
        key: makeKey(),
        size,
        color,
        sku: baseSku ? `${baseSku}-${colorCode(color)}-${size}` : "",
        price: "",
        stock: "10",
        lowStockThreshold: "5",
      },
    ]);
  }

  function generateSkus() {
    if (!baseSku.trim()) {
      toast.error("Add a product SKU first, then generate variant SKUs.");
      return;
    }
    setVariants((current) =>
      current.map((variant) => ({
        ...variant,
        sku: `${baseSku.trim()}-${colorCode(variant.color)}-${variant.size}`,
      })),
    );
    toast.success("Variant SKUs generated from the product SKU.");
  }

  function updateImage(key: string, patch: Partial<ImageDraft>) {
    setImages((current) =>
      current.map((image) => (image.key === key ? { ...image, ...patch } : image)),
    );
  }

  function setPrimary(key: string) {
    setImages((current) =>
      current.map((image) => ({ ...image, isPrimary: image.key === key })),
    );
  }

  function addImage(url: string, alt = "") {
    const clean = url.trim();
    if (!clean) return;
    setImages((current) => [
      ...current,
      { key: makeKey(), url: clean, alt, isPrimary: current.length === 0 },
    ]);
    setUrlInput("");
  }

  async function uploadFile(file: File) {
    if (!cloudinaryCloudName || !cloudinaryPreset) {
      toast.error("Cloudinary is not configured. Paste an image URL instead.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", cloudinaryPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
        { method: "POST", body },
      );

      if (!response.ok) throw new Error(`Cloudinary responded ${response.status}`);

      const data = (await response.json()) as { secure_url?: string };
      if (!data.secure_url) throw new Error("No URL returned by Cloudinary");

      addImage(data.secure_url, name);
      toast.success("Image uploaded.");
    } catch (error) {
      console.error("[admin] Cloudinary upload failed", error);
      toast.error("Upload failed. Check your Cloudinary preset, or paste a URL.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const fieldError = (key: string) => state.fieldErrors?.[key]?.[0];

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="productId" value={product?.id ?? ""} />
      <input type="hidden" name="variantsJson" value={JSON.stringify(variantPayload)} />
      <input type="hidden" name="imagesJson" value={JSON.stringify(imagePayload)} />

      {state.message && !state.ok ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-xl text-stone-900">Product details</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Clear, specific names and descriptions help customers find the right piece.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="name">Product name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  maxLength={200}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1.5"
                  aria-invalid={Boolean(fieldError("name"))}
                />
                {fieldError("name") ? <p className="field-error">{fieldError("name")}</p> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="slug">URL slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    required
                    maxLength={220}
                    value={effectiveSlug}
                    onChange={(event) => {
                      setSlug(event.target.value);
                      setSlugTouched(true);
                    }}
                    className="mt-1.5 font-mono text-xs"
                    aria-invalid={Boolean(fieldError("slug"))}
                  />
                  {fieldError("slug") ? <p className="field-error">{fieldError("slug")}</p> : null}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    /products/{effectiveSlug || "your-product"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="sku">Product SKU</Label>
                  <Input
                    id="sku"
                    name="sku"
                    required
                    maxLength={80}
                    value={baseSku}
                    onChange={(event) => setBaseSku(event.target.value.toUpperCase())}
                    className="mt-1.5 font-mono text-xs uppercase"
                    aria-invalid={Boolean(fieldError("sku"))}
                  />
                  {fieldError("sku") ? <p className="field-error">{fieldError("sku")}</p> : null}
                </div>
              </div>

              <div>
                <Label htmlFor="shortDescription">Short description</Label>
                <Input
                  id="shortDescription"
                  name="shortDescription"
                  maxLength={300}
                  defaultValue={product?.shortDescription ?? ""}
                  className="mt-1.5"
                  placeholder="One line shown on product cards"
                />
              </div>

              <div>
                <Label htmlFor="description">Full description</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  rows={8}
                  defaultValue={product?.description ?? ""}
                  className="mt-1.5"
                  aria-invalid={Boolean(fieldError("description"))}
                />
                {fieldError("description") ? (
                  <p className="field-error">{fieldError("description")}</p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fabric">Fabric / material</Label>
                  <Input
                    id="fabric"
                    name="fabric"
                    maxLength={160}
                    defaultValue={product?.fabric ?? ""}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="careInstructions">Care instructions</Label>
                  <Input
                    id="careInstructions"
                    name="careInstructions"
                    maxLength={2000}
                    defaultValue={product?.careInstructions ?? ""}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-xl text-stone-900">Variants &amp; stock</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Every size/colour combination is a variant with its own stock count.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={generateSkus}>
                  <Wand2 aria-hidden="true" />
                  Generate SKUs
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={addVariant}>
                  <Plus aria-hidden="true" />
                  Add variant
                </Button>
              </div>
            </div>

            {variants.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-muted-foreground">
                Add at least one variant so customers can buy this product.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    <tr>
                      <th scope="col" className="pb-2 pr-2 font-semibold">
                        Colour
                      </th>
                      <th scope="col" className="pb-2 pr-2 font-semibold">
                        Size
                      </th>
                      <th scope="col" className="pb-2 pr-2 font-semibold">
                        SKU
                      </th>
                      <th scope="col" className="pb-2 pr-2 font-semibold">
                        Price override
                      </th>
                      <th scope="col" className="pb-2 pr-2 font-semibold">
                        Stock
                      </th>
                      <th scope="col" className="pb-2 pr-2 font-semibold">
                        Low at
                      </th>
                      <th scope="col" className="pb-2 font-semibold">
                        <span className="sr-only">Remove</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant, index) => (
                      <tr key={variant.key} className="border-t border-stone-100">
                        <td className="py-2 pr-2">
                          <Input
                            aria-label={`Colour for variant ${index + 1}`}
                            value={variant.color}
                            onChange={(event) =>
                              updateVariant(variant.key, { color: event.target.value })
                            }
                            className="h-9 min-w-24"
                            required
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <Input
                            aria-label={`Size for variant ${index + 1}`}
                            value={variant.size}
                            onChange={(event) =>
                              updateVariant(variant.key, { size: event.target.value })
                            }
                            className="h-9 min-w-20"
                            required
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <Input
                            aria-label={`SKU for variant ${index + 1}`}
                            value={variant.sku}
                            onChange={(event) =>
                              updateVariant(variant.key, { sku: event.target.value.toUpperCase() })
                            }
                            className="h-9 min-w-40 font-mono uppercase"
                            required
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <Input
                            aria-label={`Price override for variant ${index + 1}`}
                            type="number"
                            min={0}
                            step={1}
                            placeholder="Base"
                            value={variant.price}
                            onChange={(event) =>
                              updateVariant(variant.key, { price: event.target.value })
                            }
                            className="h-9 w-24"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <Input
                            aria-label={`Stock for variant ${index + 1}`}
                            type="number"
                            min={0}
                            step={1}
                            value={variant.stock}
                            onChange={(event) =>
                              updateVariant(variant.key, { stock: event.target.value })
                            }
                            className="h-9 w-20"
                            required
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <Input
                            aria-label={`Low stock threshold for variant ${index + 1}`}
                            type="number"
                            min={0}
                            step={1}
                            value={variant.lowStockThreshold}
                            onChange={(event) =>
                              updateVariant(variant.key, { lowStockThreshold: event.target.value })
                            }
                            className="h-9 w-16"
                          />
                        </td>
                        <td className="py-2">
                          <button
                            type="button"
                            onClick={() =>
                              setVariants((current) =>
                                current.filter((item) => item.key !== variant.key),
                              )
                            }
                            className="grid size-8 place-items-center rounded-md text-stone-400 hover:bg-red-50 hover:text-red-700"
                            aria-label={`Remove variant ${index + 1}`}
                          >
                            <Trash2 aria-hidden="true" className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {state.fieldErrors?.variants ? (
              <p className="field-error">{state.fieldErrors.variants[0]}</p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-xl text-stone-900">Images</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              The first image (or the one marked primary) appears on product cards.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="imageUrl">Paste an image URL</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    id="imageUrl"
                    value={urlInput}
                    onChange={(event) => setUrlInput(event.target.value)}
                    placeholder="https://res.cloudinary.com/…"
                  />
                  <Button type="button" variant="outline" onClick={() => addImage(urlInput)}>
                    <Link2 aria-hidden="true" />
                    Add
                  </Button>
                </div>
              </div>

              <div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadFile(file);
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={uploading}
                  onClick={() => fileInput.current?.click()}
                >
                  {uploading ? (
                    <Loader2 aria-hidden="true" className="animate-spin" />
                  ) : (
                    <Upload aria-hidden="true" />
                  )}
                  {uploading ? "Uploading…" : "Upload image"}
                </Button>
                {!cloudinaryCloudName || !cloudinaryPreset ? (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Cloudinary not configured — URL only.
                  </p>
                ) : null}
              </div>
            </div>

            {images.length === 0 ? (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-stone-300 p-6 text-sm text-muted-foreground">
                <ImagePlus aria-hidden="true" className="size-5" />
                No images yet. Add at least one.
              </div>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {images.map((image, index) => (
                  <li
                    key={image.key}
                    className="flex gap-3 rounded-xl border border-stone-200 p-3"
                  >
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-stone-100">
                      {image.url ? (
                        <Image
                          src={image.url}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <Input
                        aria-label={`Alt text for image ${index + 1}`}
                        value={image.alt}
                        onChange={(event) =>
                          updateImage(image.key, { alt: event.target.value })
                        }
                        placeholder="Alt text"
                        className="h-8 text-xs"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPrimary(image.key)}
                          className={
                            image.isPrimary
                              ? "inline-flex items-center gap-1 rounded-full bg-brand-700 px-2 py-1 text-[10px] font-semibold text-white"
                              : "inline-flex items-center gap-1 rounded-full border border-stone-200 px-2 py-1 text-[10px] font-semibold text-stone-600 hover:border-brand-500"
                          }
                        >
                          <Star aria-hidden="true" className="size-3" />
                          {image.isPrimary ? "Primary" : "Make primary"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setImages((current) =>
                              current.filter((item) => item.key !== image.key),
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-stone-500 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 aria-hidden="true" className="size-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {state.fieldErrors?.images ? (
              <p className="field-error">{state.fieldErrors.images[0]}</p>
            ) : null}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg text-stone-900">Pricing</h2>

            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="basePrice">Price (PKR)</Label>
                <Input
                  id="basePrice"
                  name="basePrice"
                  type="number"
                  min={1}
                  step={1}
                  required
                  defaultValue={product?.basePrice ?? ""}
                  className="mt-1.5"
                  aria-invalid={Boolean(fieldError("basePrice"))}
                />
                {fieldError("basePrice") ? (
                  <p className="field-error">{fieldError("basePrice")}</p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="compareAtPrice">Compare-at price (PKR)</Label>
                <Input
                  id="compareAtPrice"
                  name="compareAtPrice"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={product?.compareAtPrice ?? ""}
                  placeholder="Optional — shows a strikethrough"
                  className="mt-1.5"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg text-stone-900">Organisation</h2>

            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="categoryId">Category</Label>
                <NativeSelect
                  id="categoryId"
                  name="categoryId"
                  required
                  defaultValue={product?.categoryId ?? ""}
                  className="mt-1.5"
                >
                  <option value="" disabled>
                    Choose a category
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </NativeSelect>
                {fieldError("categoryId") ? (
                  <p className="field-error">{fieldError("categoryId")}</p>
                ) : null}
              </div>

              <label className="flex items-start gap-2.5 text-sm">
                <Checkbox
                  name="isActive"
                  defaultChecked={product ? product.isActive : true}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-stone-800">Visible in store</span>
                  <span className="block text-[11px] text-muted-foreground">
                    Hidden products stay in the admin but cannot be bought.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-sm">
                <Checkbox
                  name="isFeatured"
                  defaultChecked={product?.isFeatured ?? false}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-stone-800">Featured</span>
                  <span className="block text-[11px] text-muted-foreground">
                    Shown in the homepage edit.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-sm">
                <Checkbox
                  name="isNewArrival"
                  defaultChecked={product?.isNewArrival ?? false}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-stone-800">New arrival</span>
                  <span className="block text-[11px] text-muted-foreground">
                    Appears in the new arrivals collection.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <Plus aria-hidden="true" />
              )}
              {isPending ? "Saving…" : product ? "Save changes" : "Create product"}
            </Button>
            <Button asChild variant="ghost" className="mt-2 w-full">
              <Link href="/admin/products">Cancel</Link>
            </Button>
            <p className="mt-3 text-center text-[10px] text-muted-foreground">
              Changes go live immediately after saving.
            </p>
          </section>
        </aside>
      </div>
    </form>
  );
}
