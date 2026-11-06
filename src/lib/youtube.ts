const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);

/**
 * Extracts the 11-character video ID from a bare ID or one of:
 *   youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 * Returns null for anything else.
 */
export function extractYoutubeId(input: string): string | null {
  const value = input.trim();
  if (ID_PATTERN.test(value)) return value;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  let candidate: string | null = null;

  if (host === "youtu.be") {
    candidate = url.pathname.split("/")[1] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (url.pathname === "/watch") {
      candidate = url.searchParams.get("v");
    } else if (url.pathname.startsWith("/embed/")) {
      candidate = url.pathname.split("/")[2] ?? null;
    }
  }

  return candidate && ID_PATTERN.test(candidate) ? candidate : null;
}
