"use client";

import { clsx } from "clsx";
import { ImageOff, Upload } from "lucide-react";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { deleteMediaAction, updateMediaAltAction, uploadMediaAction } from "@/app/actions/media";
import { ToastMessage } from "@/components/ui/toast-message";
import { formatBytes, formatShortDate } from "@/lib/format";
import type { MediaItem } from "@/lib/types";
import { buttonPrimary, buttonSecondary, focusRing, inputBase } from "@/lib/ui";

type MediaLibraryProps = {
  items: MediaItem[];
};

type Feedback = { tone: "success" | "error"; text: string } | null;

function MediaTile({ item, onFeedback }: { item: MediaItem; onFeedback: (feedback: Feedback) => void }) {
  const [alt, setAlt] = useState(item.altText);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const altId = `media-alt-${item.id}`;

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-paper p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.publicUrl}
        alt={item.altText || "Uploaded image without alt text"}
        loading="lazy"
        className="aspect-video w-full rounded-lg border border-border bg-surface object-cover"
      />
      <p className="text-sm text-muted">
        {formatBytes(item.sizeBytes)} · <time dateTime={item.createdAt}>{formatShortDate(item.createdAt)}</time>
      </p>
      <form
        className="flex flex-col gap-2"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await updateMediaAltAction(item.id, alt);
            onFeedback(result.ok ? { tone: "success", text: "Alt text saved." } : { tone: "error", text: result.error });
          });
        }}
      >
        <label htmlFor={altId} className="text-sm font-semibold text-ink">
          Alt text
        </label>
        <div className="flex gap-2">
          <input
            id={altId}
            type="text"
            value={alt}
            maxLength={300}
            onChange={(event) => setAlt(event.target.value)}
            className={clsx(inputBase, "h-10 border-border text-sm")}
          />
          <button type="submit" disabled={isPending || alt === item.altText} className={clsx(buttonSecondary, "h-10 px-3")}>
            Save
          </button>
        </div>
      </form>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Confirm delete">
          <span className="text-sm text-ink">Delete this image?</span>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteMediaAction(item.id);
                onFeedback(result.ok ? { tone: "success", text: "Image deleted." } : { tone: "error", text: result.error });
                setConfirming(false);
              })
            }
            className={clsx(
              "inline-flex h-9 items-center rounded-md bg-ink px-3 text-sm font-semibold text-paper hover:bg-ink/85",
              focusRing,
            )}
          >
            Yes, delete
          </button>
          <button type="button" onClick={() => setConfirming(false)} className={clsx(buttonSecondary, "h-9 px-3")}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Delete image ${item.altText || item.storagePath}`}
          className={clsx("w-fit rounded-sm text-sm font-semibold text-ink underline-offset-4 hover:underline", focusRing)}
        >
          Delete
        </button>
      )}
    </li>
  );
}

export function MediaLibrary({ items }: MediaLibraryProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isPending, startTransition] = useTransition();

  function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setFeedback({ tone: "error", text: "Choose an image to upload." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ tone: "error", text: "Images must be 5 MB or smaller." });
      return;
    }
    const data = new FormData();
    data.set("file", file);
    data.set("altText", altText);
    startTransition(async () => {
      const result = await uploadMediaAction(data);
      if (result.ok) {
        setFeedback({ tone: "success", text: "Image uploaded." });
        setAltText("");
        if (fileRef.current) fileRef.current.value = "";
      } else {
        setFeedback({ tone: "error", text: result.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onUpload} className="flex flex-col gap-4 rounded-xl border border-border bg-paper p-6">
        <h2 className="text-lg font-semibold text-ink">Upload an image</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="media-file" className="text-sm font-semibold text-ink">
              Image file
            </label>
            <input
              ref={fileRef}
              id="media-file"
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              aria-describedby="media-file-hint"
              className={clsx(
                "text-sm text-ink file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink",
                focusRing,
              )}
            />
            <p id="media-file-hint" className="text-sm text-muted">
              JPEG, PNG, WebP, or GIF up to 5 MB.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="media-alt" className="text-sm font-semibold text-ink">
              Alt text
            </label>
            <input
              id="media-alt"
              type="text"
              value={altText}
              maxLength={300}
              onChange={(event) => setAltText(event.target.value)}
              className={clsx(inputBase, "h-11 border-border")}
            />
          </div>
        </div>
        <button type="submit" disabled={isPending} className={clsx(buttonPrimary, "w-fit")}>
          <Upload aria-hidden="true" className="size-4" />
          {isPending ? "Uploading..." : "Upload"}
        </button>
      </form>

      {feedback ? <ToastMessage tone={feedback.tone}>{feedback.text}</ToastMessage> : null}

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-paper px-6 py-12 text-center">
          <ImageOff aria-hidden="true" className="size-6 text-primary" />
          <p className="font-serif text-xl font-semibold text-ink">No images yet</p>
          <p className="text-sm text-muted">Images you upload here or in the story editor appear in this library.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <MediaTile key={item.id} item={item} onFeedback={setFeedback} />
          ))}
        </ul>
      )}
    </div>
  );
}
