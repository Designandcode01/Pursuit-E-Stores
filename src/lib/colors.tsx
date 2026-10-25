const SWATCHES: Record<string, string> = {
  ivory: "#f3ecdc",
  white: "#ffffff",
  black: "#1c1917",
  charcoal: "#374151",
  grey: "#9ca3af",
  sand: "#d6c3a1",
  beige: "#e3d5bd",
  natural: "#d9c7a7",
  emerald: "#14532d",
  green: "#16a34a",
  olive: "#556b2f",
  mint: "#86efac",
  teal: "#0f766e",
  turquoise: "#14b8a6",
  navy: "#1e3a5f",
  blue: "#1d4ed8",
  sky: "#7dd3fc",
  maroon: "#7f1d1d",
  red: "#b91c1c",
  rust: "#b45309",
  terracotta: "#c2410c",
  peach: "#f5b7a3",
  coral: "#fb7185",
  pink: "#db2777",
  lilac: "#c4b5fd",
  purple: "#7e22ce",
  gold: "#b08d57",
  mustard: "#d97706",
  multi: "linear-gradient(135deg, #16a34a 0%, #d97706 50%, #7e22ce 100%)",
};

export function colorToCss(color: string) {
  return SWATCHES[color.trim().toLowerCase()] ?? "#d6d3d1";
}

export function ColorSwatch({
  color,
  size = "sm",
  selected = false,
  className = "",
}: {
  color: string;
  size?: "sm" | "md";
  selected?: boolean;
  className?: string;
}) {
  const dimensions = size === "sm" ? "size-3.5" : "size-6";
  return (
    <span
      title={color}
      aria-hidden="true"
      className={`${dimensions} inline-block shrink-0 rounded-full border ${
        selected ? "ring-2 ring-brand-700 ring-offset-2" : "border-stone-300"
      } ${className}`}
      style={{ background: colorToCss(color) }}
    />
  );
}
