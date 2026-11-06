/**
 * Returns `next` only when it is a same-site relative path.
 * Rejects protocol-relative URLs ("//host"), backslashes, and anything not starting with "/".
 */
export function safeNext(next: unknown, fallback: string): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  if (next.includes("\\")) return fallback;
  return next;
}
