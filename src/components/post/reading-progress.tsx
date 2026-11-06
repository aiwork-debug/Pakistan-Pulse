"use client";

import { useEffect, useState } from "react";

/** 2px primary bar fixed to the top of the viewport; its width follows reading progress. */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      });
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent">
      <div
        className="h-full origin-left bg-primary motion-safe:transition-transform motion-safe:duration-100"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
