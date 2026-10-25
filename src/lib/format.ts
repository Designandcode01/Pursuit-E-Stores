const pkrFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/**
 * Prices are stored as whole PKR (there are no circulating paisa coins in
 * everyday retail). We still build the string with Intl so locale-aware
 * grouping is correct, then swap the locale's "Rs" symbol for the ₨ glyph
 * used across the storefront.
 */
export function formatPKR(amount: number) {
  return pkrFormatter
    .formatToParts(Math.round(amount))
    .map((part) => (part.type === "currency" ? "₨" : part.value))
    .join("");
}

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Karachi",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-PK", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Karachi",
});

export function formatDate(value: Date | string | number) {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: Date | string | number) {
  return dateTimeFormatter.format(new Date(value));
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-PK").format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-PK", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function discountPercent(price: number, compareAtPrice: number | null) {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function estimatedDelivery(method: "standard" | "express", from = new Date()) {
  const days = method === "express" ? 2 : 5;
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return dateFormatter.format(date);
}
