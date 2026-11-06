/*
 * Shared class strings so every control looks and behaves the same.
 * Kept in one place so Tailwind can see them and components stay consistent.
 */

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** 2px primary underline that grows from the left in 200ms on hover (and for the current page). */
export const underlineGrow =
  "relative after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary after:content-[''] hover:after:scale-x-100 aria-[current=page]:after:scale-x-100 motion-safe:after:transition-transform motion-safe:after:duration-200";

const buttonBase =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 motion-safe:transition motion-safe:duration-150 motion-safe:hover:-translate-y-px motion-safe:disabled:hover:translate-y-0";

export const buttonPrimary = `${buttonBase} bg-primary text-paper hover:bg-primary-hover ${focusRing}`;

export const buttonSecondary = `${buttonBase} border border-border bg-paper text-ink hover:border-ink ${focusRing}`;

export const buttonGhost = `${buttonBase} text-ink hover:bg-surface ${focusRing}`;

export const textLink = `rounded-sm font-semibold text-primary underline-offset-4 hover:underline ${focusRing}`;

export const inputBase = `w-full rounded-md border bg-paper px-3 text-base text-ink placeholder:text-muted ${focusRing}`;

export const kicker = "text-xs font-semibold uppercase tracking-[0.18em] text-primary";
