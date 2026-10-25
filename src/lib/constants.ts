import type { PaymentMethod, Province, ShippingMethod } from "@/types/commerce";

export const STORE = {
  name: "Hunar Bazaar",
  tagline: "Crafted in Pakistan, delivered with care.",
  description:
    "Shop unstitched lawn, kurtas, shawls, khussa, prayer rugs and handmade Pakistani crafts. Cash on delivery across Pakistan.",
  email: process.env.NEXT_PUBLIC_STORE_EMAIL ?? "hello@hunarbazaar.pk",
  phone: process.env.NEXT_PUBLIC_STORE_PHONE ?? "+92 300 1234567",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "923001234567",
  instagram: "https://instagram.com",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const PROVINCES: { value: Province; label: string }[] = [
  { value: "punjab", label: "Punjab" },
  { value: "sindh", label: "Sindh" },
  { value: "khyber_pakhtunkhwa", label: "Khyber Pakhtunkhwa" },
  { value: "balochistan", label: "Balochistan" },
  { value: "gilgit_baltistan", label: "Gilgit-Baltistan" },
  { value: "azad_jammu_kashmir", label: "Azad Jammu & Kashmir" },
  { value: "islamabad_capital_territory", label: "Islamabad Capital Territory" },
];

export const PROVINCE_LABELS = Object.fromEntries(
  PROVINCES.map((province) => [province.value, province.label]),
) as Record<Province, string>;

export const FREE_SHIPPING_THRESHOLD = 5_000;

export const SHIPPING_METHODS: Record<
  ShippingMethod,
  { label: string; fee: number; eta: string; description: string }
> = {
  standard: {
    label: "Standard delivery",
    fee: 250,
    eta: "3–5 working days",
    description: "Nationwide courier delivery. Free on orders over Rs. 5,000.",
  },
  express: {
    label: "Express delivery",
    fee: 500,
    eta: "1–2 working days",
    description: "Priority dispatch for major cities. Flat rate.",
  },
};

export function shippingFeeFor(method: ShippingMethod, subtotal: number) {
  if (method === "standard" && subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_METHODS[method].fee;
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const ORDER_STATUS_META: Record<
  (typeof ORDER_STATUSES)[number],
  { label: string; description: string; tone: "amber" | "blue" | "violet" | "green" | "red" }
> = {
  pending: {
    label: "Pending",
    description: "We have received your order and will confirm it shortly.",
    tone: "amber",
  },
  confirmed: {
    label: "Confirmed",
    description: "Your order is confirmed and is being prepared.",
    tone: "blue",
  },
  shipped: {
    label: "Shipped",
    description: "Your parcel is on its way.",
    tone: "violet",
  },
  delivered: {
    label: "Delivered",
    description: "Delivered. We hope you love it!",
    tone: "green",
  },
  cancelled: {
    label: "Cancelled",
    description: "This order was cancelled.",
    tone: "red",
  },
};

export const PAYMENT_METHODS: Record<
  PaymentMethod,
  { label: string; shortLabel: string; description: string; available: boolean }
> = {
  cod: {
    label: "Cash on Delivery",
    shortLabel: "COD",
    description: "Pay the courier in cash when your parcel arrives. Most popular in Pakistan.",
    available: true,
  },
  bank_transfer: {
    label: "Bank transfer",
    shortLabel: "Bank",
    description: "Transfer to our account and share the reference. We verify manually.",
    available: true,
  },
  card: {
    label: "Debit / credit card",
    shortLabel: "Card",
    description: "Secure checkout via Safepay. Coming soon.",
    available: process.env.NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS === "true",
  },
  jazzcash: {
    label: "JazzCash",
    shortLabel: "JazzCash",
    description: "Pay with your JazzCash mobile wallet. Coming soon.",
    available: process.env.NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS === "true",
  },
  easypaisa: {
    label: "Easypaisa",
    shortLabel: "Easypaisa",
    description: "Pay with your Easypaisa mobile wallet. Coming soon.",
    available: process.env.NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS === "true",
  },
};

export const PAYMENT_STATUS_META = {
  unpaid: { label: "Unpaid", tone: "amber" as const },
  pending_verification: { label: "Awaiting verification", tone: "blue" as const },
  paid: { label: "Paid", tone: "green" as const },
  refunded: { label: "Refunded", tone: "violet" as const },
  failed: { label: "Failed", tone: "red" as const },
};

export const BANK_DETAILS = {
  bankName: process.env.NEXT_PUBLIC_BANK_NAME ?? "Meezan Bank",
  accountTitle: process.env.NEXT_PUBLIC_BANK_ACCOUNT_TITLE ?? "Hunar Bazaar (Pvt) Ltd",
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? "01234567890123",
  iban: process.env.NEXT_PUBLIC_BANK_IBAN ?? "PK00MEZN0000000123456789",
};

export const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42"] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
] as const;

export const PRODUCTS_PER_PAGE = 12;
