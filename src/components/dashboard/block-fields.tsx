"use client";

import { clsx } from "clsx";
import { useId, type ReactNode } from "react";
import { ImageUpload } from "@/components/dashboard/image-upload";
import type { BlockInput } from "@/lib/post-schemas";
import { inputBase } from "@/lib/ui";
import { extractYoutubeId } from "@/lib/youtube";

type BlockFieldsProps = {
  block: BlockInput;
  error?: string;
  onChange: (next: BlockInput) => void;
};

function TextField({
  id,
  label,
  value,
  onChange,
  multiline = false,
  rows = 4,
  hint,
  describedBy,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  hint?: string;
  describedBy?: string;
  maxLength?: number;
}) {
  const ids = [hint ? `${id}-hint` : null, describedBy ?? null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          maxLength={maxLength}
          aria-describedby={ids}
          onChange={(event) => onChange(event.target.value)}
          className={clsx(inputBase, "border-border py-2.5 leading-7")}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          maxLength={maxLength}
          aria-describedby={ids}
          onChange={(event) => onChange(event.target.value)}
          className={clsx(inputBase, "h-11 border-border")}
        />
      )}
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function BlockFields({ block, error, onChange }: BlockFieldsProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : undefined;
  const field = (name: string) => `${id}-${name}`;

  let content: ReactNode;
  switch (block.type) {
    case "paragraph":
      content = (
        <TextField
          id={field("text")}
          label="Paragraph"
          multiline
          rows={5}
          maxLength={10000}
          value={block.text}
          describedBy={describedBy}
          hint="Plain text. Any HTML is removed when you save."
          onChange={(text) => onChange({ ...block, text })}
        />
      );
      break;
    case "heading":
      content = (
        <TextField
          id={field("text")}
          label="Heading"
          maxLength={200}
          value={block.text}
          describedBy={describedBy}
          hint="Appears in the story's table of contents."
          onChange={(text) => onChange({ ...block, text })}
        />
      );
      break;
    case "quote":
      content = (
        <div className="grid gap-4">
          <TextField id={field("text")} label="Quote" multiline rows={3} maxLength={2000} value={block.text} describedBy={describedBy} onChange={(text) => onChange({ ...block, text })} />
          <TextField id={field("attribution")} label="Attribution" maxLength={200} value={block.attribution} onChange={(attribution) => onChange({ ...block, attribution })} />
        </div>
      );
      break;
    case "image":
      content = (
        <div className="grid gap-4">
          {block.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.url} alt={block.alt || "Uploaded image preview"} className="max-h-72 w-full rounded-lg border border-border bg-surface object-contain" />
          ) : (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-surface text-sm text-muted">
              No image yet
            </div>
          )}
          <ImageUpload
            id={field("file")}
            label={block.url ? "Replace image" : "Upload image"}
            onUploaded={(url, alt) => onChange({ ...block, url, alt: block.alt || alt })}
          />
          <TextField id={field("alt")} label="Alt text" maxLength={300} value={block.alt} describedBy={describedBy} hint="Describe the image for readers who cannot see it." onChange={(alt) => onChange({ ...block, alt })} />
          <TextField id={field("caption")} label="Caption" maxLength={500} value={block.caption} onChange={(caption) => onChange({ ...block, caption })} />
        </div>
      );
      break;
    case "youtube": {
      const detected = block.url.trim() ? extractYoutubeId(block.url) : null;
      content = (
        <div className="grid gap-4">
          <TextField
            id={field("url")}
            label="YouTube link or video ID"
            maxLength={300}
            value={block.url}
            describedBy={describedBy}
            hint={
              block.url.trim()
                ? detected
                  ? `Video ID detected: ${detected}. Only the ID is saved.`
                  : "Not recognised. Use youtube.com/watch?v=, youtu.be/, youtube.com/embed/, or an 11-character ID."
                : "Paste youtube.com/watch?v=…, youtu.be/…, youtube.com/embed/…, or the 11-character ID."
            }
            onChange={(url) => onChange({ ...block, url })}
          />
          <TextField id={field("title")} label="Video title" maxLength={200} value={block.title} onChange={(title) => onChange({ ...block, title })} />
        </div>
      );
      break;
    }
    case "tweet":
      content = (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id={field("author")} label="Author name" maxLength={100} value={block.author} describedBy={describedBy} onChange={(author) => onChange({ ...block, author })} />
          <TextField id={field("handle")} label="Handle" maxLength={50} value={block.handle} hint="For example @pulse_news" onChange={(handle) => onChange({ ...block, handle })} />
          <div className="sm:col-span-2">
            <TextField id={field("text")} label="Post text" multiline rows={3} maxLength={1000} value={block.text} hint="Plain text only. No embed is loaded." onChange={(text) => onChange({ ...block, text })} />
          </div>
        </div>
      );
      break;
    case "video":
      content = (
        <div className="grid gap-4">
          <TextField
            id={field("src")}
            label="HLS source"
            maxLength={500}
            value={block.src}
            describedBy={describedBy}
            hint="A Supabase Storage path or https URL ending in .m3u8. Leave empty to show the placeholder."
            onChange={(src) => onChange({ ...block, src })}
          />
          <TextField id={field("title")} label="Video title" maxLength={200} value={block.title} onChange={(title) => onChange({ ...block, title })} />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-ink">Poster image</p>
            {block.poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={block.poster} alt="Poster preview" className="max-h-40 w-fit rounded-lg border border-border" />
            ) : null}
            <ImageUpload
              id={field("poster")}
              label={block.poster ? "Replace poster" : "Upload poster"}
              onUploaded={(poster) => onChange({ ...block, poster })}
            />
          </div>
        </div>
      );
      break;
  }

  return (
    <div className="flex flex-col gap-3">
      {content}
      {error ? (
        <p id={errorId} className="border-l-2 border-ink pl-2 text-sm text-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
