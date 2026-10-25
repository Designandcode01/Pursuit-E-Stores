import type { ZodError } from "zod";

/**
 * Zod v4's deprecated `flatten()` returns loosely typed values, so build the
 * field-error map from `issues` instead.
 */
export function zodFieldErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join(".") : "_form";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }

  return fieldErrors;
}

export function firstZodMessage(error: ZodError, fallback = "Please check the form and try again.") {
  return error.issues[0]?.message ?? fallback;
}
