import { z } from "zod";

import { ORDER_STATUSES } from "@/lib/constants";

export const PROVINCE_VALUES = [
  "punjab",
  "sindh",
  "khyber_pakhtunkhwa",
  "balochistan",
  "gilgit_baltistan",
  "azad_jammu_kashmir",
  "islamabad_capital_territory",
] as const;

export const provinceSchema = z.enum(PROVINCE_VALUES, {
  message: "Select a province",
});

/**
 * Accepts 03xxxxxxxx, 3xxxxxxxxx, +92 3xx xxxxxxx and 0092… forms and returns
 * a canonical +92 number. Pakistani mobile numbers are 10 digits after +92.
 */
export function normalizePakistaniPhone(input: string) {
  let value = input.replace(/[^\d+]/g, "");
  if (value.startsWith("+92")) value = value.slice(3);
  else if (value.startsWith("0092")) value = value.slice(4);
  else if (value.startsWith("92") && value.replace(/\D/g, "").length === 12) {
    value = value.slice(2);
  } else if (value.startsWith("0")) value = value.slice(1);

  return `+92${value}`;
}

export function isValidPakistaniPhone(input: string) {
  const normalized = normalizePakistaniPhone(input);
  return /^\+923\d{9}$/.test(normalized);
}

export const pkPhoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine(isValidPakistaniPhone, {
    message: "Enter a valid Pakistani mobile number, e.g. 0300 1234567",
  })
  .transform(normalizePakistaniPhone);

export const formBoolean = z.preprocess(
  (value) => value === true || value === "true" || value === "on" || value === "1",
  z.boolean(),
);

/**
 * Empty number inputs submit `""`. Plain `z.coerce.number()` turns that into
 * `0`, which passes non-negative bounds and silently saves a zero instead of
 * NULL (e.g. a compare-at price below the base price, or a zero discount cap).
 * Treat blank values as absent before coercing.
 */
const optionalInteger = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().int().min(min).max(max).optional(),
  );

export const addressSchema = z.object({
  label: z.string().trim().min(1).max(60).default("Home"),
  fullName: z
    .string()
    .trim()
    .min(2, "Full name is required")
    .max(160, "Name is too long"),
  phone: pkPhoneSchema,
  province: provinceSchema,
  city: z.string().trim().min(2, "City is required").max(120),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Postal code must be 5 digits")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  street: z
    .string()
    .trim()
    .min(8, "Include house number and street")
    .max(500, "Address is too long"),
  landmark: z.string().trim().max(200).optional().or(z.literal("").transform(() => undefined)),
  isDefault: formBoolean.optional().default(false),
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(120),
  lastName: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined))
    .refine((value) => !value || isValidPakistaniPhone(value), {
      message: "Enter a valid Pakistani mobile number",
    })
    .transform((value) => (value ? normalizePakistaniPhone(value) : undefined)),
});

export const checkoutSchema = addressSchema.extend({
  shippingMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["cod", "bank_transfer", "card", "jazzcash", "easypaisa"]),
  couponCode: z.string().trim().max(40).optional().or(z.literal("").transform(() => undefined)),
  notes: z
    .string()
    .trim()
    .max(1000, "Please keep notes under 1000 characters")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  saveAddress: formBoolean.optional().default(false),
  terms: z.literal(true, { message: "Please accept the terms to place your order" }),
});

export const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z
    .string()
    .trim()
    .max(140, "Title is too long")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  body: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters")
    .max(2000, "Review is too long"),
});

export const variantInputSchema = z.object({
  id: z.string().uuid().optional(),
  size: z.string().trim().min(1, "Size is required").max(40),
  color: z.string().trim().min(1, "Colour is required").max(60),
  sku: z.string().trim().min(1, "Variant SKU is required").max(100),
  price: z.coerce.number().int().nonnegative().nullable().optional(),
  stock: z.coerce.number().int().min(0).max(100_000),
  lowStockThreshold: z.coerce.number().int().min(0).max(10_000).default(5),
});

export const imageInputSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().trim().min(1, "Image URL is required").max(1000),
  alt: z.string().trim().max(250).optional(),
  isPrimary: z.boolean().default(false),
});

export const productSchema = z.object({
  name: z.string().trim().min(3, "Product name is required").max(200),
  slug: z
    .string()
    .trim()
    .min(3, "Slug is required")
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  description: z.string().trim().min(20, "Add a fuller product description").max(10_000),
  shortDescription: z.string().trim().max(300).optional().or(z.literal("").transform(() => undefined)),
  categoryId: z.string().uuid("Choose a category"),
  basePrice: z.coerce.number().int().min(1, "Price is required").max(10_000_000),
  compareAtPrice: optionalInteger(0, 10_000_000),
  sku: z.string().trim().min(1, "Product SKU is required").max(80),
  fabric: z.string().trim().max(160).optional().or(z.literal("").transform(() => undefined)),
  careInstructions: z.string().trim().max(2000).optional().or(z.literal("").transform(() => undefined)),
  isFeatured: formBoolean.optional().default(false),
  isNewArrival: formBoolean.optional().default(false),
  isActive: formBoolean.optional().default(true),
  variants: z.array(variantInputSchema).min(1, "Add at least one variant"),
  images: z.array(imageInputSchema).min(1, "Add at least one image"),
});

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Category name is required").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  imageUrl: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: formBoolean.optional().default(true),
});

export const couponSchema = z
  .object({
    id: z.string().uuid().optional(),
    code: z
      .string()
      .trim()
      .min(3, "Code is required")
      .max(40)
      .transform((value) => value.toUpperCase()),
    description: z
      .string()
      .trim()
      .max(240)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    type: z.enum(["percentage", "fixed"]),
    value: z.coerce.number().int().min(1, "Value must be positive").max(1_000_000),
    minSubtotal: z.coerce.number().int().min(0).max(10_000_000).default(0),
    maxDiscount: optionalInteger(0, 10_000_000),
    usageLimit: optionalInteger(1, 1_000_000),
    startsAt: z
      .string()
      .trim()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    expiresAt: z
      .string()
      .trim()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    isActive: formBoolean.optional().default(true),
  })
  .refine((data) => data.type !== "percentage" || data.value <= 100, {
    message: "Percentage discounts cannot exceed 100",
    path: ["value"],
  })
  .refine(
    (data) => {
      if (!data.startsAt || !data.expiresAt) return true;
      return new Date(data.startsAt) < new Date(data.expiresAt);
    },
    { message: "Expiry must be after the start date", path: ["expiresAt"] },
  );

export const orderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(300).optional().or(z.literal("").transform(() => undefined)),
  trackingNumber: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const paymentStatusSchema = z.object({
  orderId: z.string().uuid(),
  paymentStatus: z.enum(["unpaid", "pending_verification", "paid", "refunded", "failed"]),
  bankReference: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const wishlistMergeSchema = z.array(
  z.object({
    productId: z.string().uuid(),
  }),
);

export const cartMergeSchema = z.array(
  z.object({
    variantId: z.string().uuid(),
    quantity: z.number().int().min(1).max(20),
  }),
);

export const searchSchema = z.object({
  q: z.string().trim().max(100).default(""),
});
