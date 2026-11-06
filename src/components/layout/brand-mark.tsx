import { clsx } from "clsx";
import Link from "next/link";
import { focusRing } from "@/lib/ui";

type BrandMarkProps = {
  size?: "sm" | "md";
  href?: string;
  className?: string;
};

export function BrandMark({ size = "md", href = "/", className }: BrandMarkProps) {
  return (
    <Link
      href={href}
      aria-label="Pulse home"
      className={clsx("group inline-flex items-center gap-2.5 rounded-md", focusRing, className)}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "flex items-center justify-center rounded-md bg-primary font-serif font-bold text-paper motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:rotate-3",
          size === "sm" ? "size-7 text-base" : "size-9 text-xl",
        )}
      >
        P
      </span>
      <span
        className={clsx(
          "font-serif font-bold tracking-tight text-ink",
          size === "sm" ? "text-lg" : "text-2xl",
        )}
      >
        Pulse
      </span>
    </Link>
  );
}
