type ImageFigureProps = {
  url: string;
  alt: string;
  caption: string;
};

/** Uploaded image from the Supabase media bucket, rendered as a real <img> with alt text. */
export function ImageFigure({ url, alt, caption }: ImageFigureProps) {
  return (
    <figure className="my-4 flex flex-col gap-3">
      {/* Uploaded media is served straight from Supabase Storage, so next/image is not used. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="w-full rounded-xl border border-border bg-surface object-cover"
      />
      {caption ? <figcaption className="text-sm leading-6 text-muted">{caption}</figcaption> : null}
    </figure>
  );
}
