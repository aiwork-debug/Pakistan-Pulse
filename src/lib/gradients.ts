/**
 * Cover and avatar gradient presets. The database stores only the key; the Tailwind
 * classes live here so the build can see them. Every preset uses the brand palette only:
 * primary teal, ink, and the neutral surface tint.
 */
export const GRADIENTS = {
  teal: { label: "Teal", className: "from-primary via-primary to-ink" },
  deep: { label: "Deep ink", className: "from-ink via-ink to-primary" },
  mist: { label: "Mist", className: "from-surface via-primary/50 to-primary" },
} as const;

export type GradientKey = keyof typeof GRADIENTS;

export const GRADIENT_KEYS = Object.keys(GRADIENTS) as GradientKey[];

export function isGradientKey(value: unknown): value is GradientKey {
  return typeof value === "string" && value in GRADIENTS;
}

/** Tailwind gradient stops for a stored key. Unknown keys fall back to teal. */
export function gradientClass(key: string | null | undefined): string {
  return isGradientKey(key) ? GRADIENTS[key].className : GRADIENTS.teal.className;
}
