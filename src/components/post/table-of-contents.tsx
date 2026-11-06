"use client";

import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { focusRing } from "@/lib/ui";

export type TocItem = { id: string; text: string };

type TableOfContentsProps = {
  items: TocItem[];
};

/** Sticky list of the story's headings. Highlights the section currently in view. */
export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -65% 0px" },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-labelledby="toc-heading" className="sticky top-28">
      <h2 id="toc-heading" className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
        In this story
      </h2>
      <ol className="mt-4 flex flex-col border-l border-border">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active ? "location" : undefined}
                className={clsx(
                  "-ml-px block border-l-2 py-1.5 pl-4 text-sm leading-6 motion-safe:transition-colors",
                  active ? "border-primary font-semibold text-primary" : "border-transparent text-muted hover:text-ink",
                  focusRing,
                )}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
