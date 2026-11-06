"use client";

import { clsx } from "clsx";
import { Check, Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { focusRing } from "@/lib/ui";

type ShareLinksProps = {
  url: string;
  title: string;
};

const linkClass = clsx(
  "inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-ink hover:border-primary hover:text-primary",
  focusRing,
);

export function ShareLinks({ url, title }: ShareLinksProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const targets = [
    { label: "X", href: `https://x.com/intent/post?url=${encodedUrl}&text=${encodeURIComponent(title)}` },
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopyFailed(false);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
    }
  }

  return (
    <section aria-labelledby="share-heading" className="flex flex-col gap-4">
      <h2 id="share-heading" className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
        Share this story
      </h2>
      <ul className="flex flex-wrap gap-3">
        {targets.map((target) => (
          <li key={target.label}>
            <a href={target.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {target.label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
        <li>
          <button type="button" onClick={copyLink} className={linkClass}>
            {copied ? (
              <Check aria-hidden="true" className="size-4 text-primary" />
            ) : (
              <Link2 aria-hidden="true" className="size-4" />
            )}
            {copied ? "Copied" : "Copy link"}
          </button>
        </li>
      </ul>
      <p role="status" className="text-sm text-muted">
        {copied ? "Link copied to clipboard." : copyFailed ? "Could not copy the link." : ""}
      </p>
    </section>
  );
}
