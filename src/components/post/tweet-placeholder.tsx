type TweetPlaceholderProps = {
  author: string;
  handle: string;
  text: string;
};

/** Plain-text quote of a social post. No third-party embed script is loaded. */
export function TweetPlaceholder({ author, handle, text }: TweetPlaceholderProps) {
  return (
    // A real X/Twitter embed widget could mount here later; for now the post is plain text only.
    <figure className="my-4 rounded-xl border border-border bg-paper p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div aria-hidden="true" className="size-10 rounded-full bg-surface ring-1 ring-border" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-ink">{author}</span>
          <span className="text-sm text-muted">{handle}</span>
        </div>
      </div>
      <blockquote className="mt-4 text-base leading-7 text-ink">{text}</blockquote>
      <figcaption className="mt-4 text-sm text-muted">Quoted social post</figcaption>
    </figure>
  );
}
