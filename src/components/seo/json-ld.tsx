export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // JSON-LD is generated from trusted, typed data (not user HTML).
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
