const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const longDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

/** "13 Oct 2026" */
export function formatShortDate(iso: string): string {
  return shortDateFormatter.format(new Date(iso));
}

/** "13 October 2026" */
export function formatLongDate(iso: string): string {
  return longDateFormatter.format(new Date(iso));
}

/** "13 Oct 2026, 08:30 UTC" */
export function formatDateTime(iso: string): string {
  return `${dateTimeFormatter.format(new Date(iso))} UTC`;
}

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** "21 Oct, 18:00" in UTC */
export function formatDayTime(iso: string): string {
  return `${dayFormatter.format(new Date(iso))}, ${timeFormatter.format(new Date(iso))}`;
}

/** "08:30" in UTC */
export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
