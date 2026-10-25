export type Province =
  | "punjab"
  | "sindh"
  | "khyber_pakhtunkhwa"
  | "balochistan"
  | "gilgit_baltistan"
  | "azad_jammu_kashmir"
  | "islamabad_capital_territory";

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export type PaymentMethod = "cod" | "bank_transfer" | "card" | "jazzcash" | "easypaisa";

export type PaymentStatus = "unpaid" | "pending_verification" | "paid" | "refunded" | "failed";

export type ShippingMethod = "standard" | "express";

export type SortOption = "newest" | "popular" | "price-asc" | "price-desc" | "rating";

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export type ProductImage = {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
};

export type ProductVariantView = {
  id: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
};

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice: number | null;
  shortDescription: string | null;
  category: { name: string; slug: string };
  image: ProductImage | null;
  secondaryImage: ProductImage | null;
  rating: number;
  reviewCount: number;
  totalStock: number;
  isNewArrival: boolean;
  isFeatured: boolean;
  defaultVariant: ProductVariantView | null;
  colors: string[];
  sizes: string[];
};

export type ProductDetailData = ProductCardData & {
  description: string;
  sku: string;
  fabric: string | null;
  careInstructions: string | null;
  images: ProductImage[];
  variants: ProductVariantView[];
};

export type CartSnapshot = {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantLabel: string;
  sku: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  maxQuantity?: number;
};

export type CartLine = CartSnapshot & {
  /** DB cart item id, or a stable local key for guests. */
  id: string;
};

export type WishlistSnapshot = {
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
};

export type AddressInput = {
  label: string;
  fullName: string;
  phone: string;
  province: Province;
  city: string;
  postalCode?: string;
  street: string;
  landmark?: string;
  isDefault?: boolean;
};

/** Serializable address shape passed from server pages to client forms. */
export type AddressView = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  province: Province;
  city: string;
  postalCode: string | null;
  street: string;
  landmark: string | null;
  isDefault: boolean;
};

export type CouponResult = {
  ok: boolean;
  message: string;
  code?: string;
  discount?: number;
  couponId?: string;
};
