"use client";

import { clsx } from "clsx";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { focusRing } from "@/lib/ui";

const SHOW_AFTER_PX = 600;

/** Appears after the reader scrolls down; returns to the top of the page. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        document.getElementById("main-content")?.focus({ preventScroll: true });
      }}
      className={clsx(
        "fixed right-4 bottom-6 z-30 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-paper shadow-lg hover:bg-primary motion-safe:animate-fade-up sm:right-8",
        focusRing,
      )}
    >
      <ArrowUp aria-hidden="true" className="size-4" />
      Back to top
    </button>
  );
}
