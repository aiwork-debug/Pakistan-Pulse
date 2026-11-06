import { clsx } from "clsx";
import Image from "next/image";
import { gradientClass } from "@/lib/gradients";

type CoverImageProps = {
  /** Uploaded cover URL. When missing, the stored gradient preset is shown instead. */
  src: string | null;
  alt: string;
  gradient: string;
  /** Wrapper classes: aspect ratio, rounding. The image fills the wrapper. */
  className?: string;
  /** Classes on the image itself, such as a hover zoom. */
  imageClassName?: string;
  /** Rendered widths for the responsive srcset, as in next/image. */
  sizes: string;
  /** Load eagerly with high priority. Use only for the largest image above the fold. */
  priority?: boolean;
};

/** A story's cover photo, cropped to fill its box, with the gradient preset as a fallback. */
export function CoverImage({ src, alt, gradient, className, imageClassName, sizes, priority = false }: CoverImageProps) {
  return (
    <div className={clsx("relative w-full overflow-hidden bg-surface", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={clsx("object-cover", imageClassName)}
        />
      ) : (
        <div
          role={alt ? "img" : undefined}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
          className={clsx("absolute inset-0 bg-linear-to-br", gradientClass(gradient), imageClassName)}
        >
          {/* Editorial texture so a story without a photo still reads as a deliberate cover. */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,var(--color-paper)_0,var(--color-paper)_1px,transparent_1px,transparent_14px)] opacity-[0.07]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,var(--color-paper)_0,transparent_50%)] opacity-15" />
          <span className="absolute bottom-3 left-4 font-serif text-sm font-bold tracking-[0.2em] text-paper/70 uppercase">
            Pulse
          </span>
        </div>
      )}
    </div>
  );
}
