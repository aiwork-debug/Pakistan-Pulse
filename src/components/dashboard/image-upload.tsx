"use client";

import { clsx } from "clsx";
import { Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { uploadMediaAction } from "@/app/actions/media";
import { buttonSecondary } from "@/lib/ui";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

type ImageUploadProps = {
  id: string;
  label: string;
  onUploaded: (url: string, alt: string) => void;
};

/** Uploads an image through the server action, which checks type, contents, and size. */
export function ImageUpload({ id, label, onUploaded }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setStatus("Images must be 5 MB or smaller.");
      return;
    }
    setBusy(true);
    setStatus("Uploading...");
    const data = new FormData();
    data.set("file", file);
    const result = await uploadMediaAction(data);
    setBusy(false);
    if (result.ok) {
      setStatus("Uploaded.");
      onUploaded(result.item.publicUrl, result.item.altText);
    } else {
      setStatus(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT}
        onChange={handleFile}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={clsx(buttonSecondary, "h-10 w-fit")}
      >
        <Upload aria-hidden="true" className="size-4" />
        {busy ? "Uploading..." : label}
      </button>
      <p role="status" className="text-sm text-muted">
        {status || "JPEG, PNG, WebP, or GIF up to 5 MB."}
      </p>
    </div>
  );
}
