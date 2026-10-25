export type QueryParamValue = string | number | boolean | null | undefined;

/**
 * Build a URL with only the parameters that carry a value. Used by catalog
 * filters so that links remain crawlable, shareable and work without JS.
 */
export function buildHref(
  basePath: string,
  params: Record<string, QueryParamValue> = {},
) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
