import { clsx } from "clsx";
import Image from "next/image";
import { gradientClass } from "@/lib/gradients";

type PersonAvatarProps = {
  name: string;
  gradient: string;
  /** Profile photo path. When missing, the initials are shown, or a silhouette if none are given. */
  photoUrl?: string | null;
  /** Fallback text, such as "IK", shown on the gradient when there is no photo. */
  initials?: string;
  /** Size, text, and ring classes for the round frame. */
  className?: string;
  sizes: string;
};

/**
 * Round profile picture. Admin names in demo mode belong to real people, so anyone without a
 * supplied photo gets initials or a generic silhouette rather than a stranger's face.
 */
export function PersonAvatar({ name, gradient, photoUrl, initials, className, sizes }: PersonAvatarProps) {
  return (
    <div
      role="img"
      aria-label={photoUrl ? `Photo of ${name}` : `Avatar for ${name}`}
      className={clsx(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br font-serif font-semibold text-paper",
        gradientClass(gradient),
        className,
      )}
    >
      {photoUrl ? (
        <Image src={photoUrl} alt="" fill sizes={sizes} className="object-cover" />
      ) : initials ? (
        <span aria-hidden="true">{initials}</span>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute inset-0 size-full text-paper/85">
          <circle cx="50" cy="38" r="18" fill="currentColor" />
          <path d="M14 100c0-22 16-36 36-36s36 14 36 36z" fill="currentColor" />
        </svg>
      )}
    </div>
  );
}
