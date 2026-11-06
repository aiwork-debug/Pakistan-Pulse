"use client";

import { clsx } from "clsx";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { DashboardSidebar, type DashboardArea } from "@/components/dashboard/dashboard-sidebar";
import { BrandMark } from "@/components/layout/brand-mark";
import { focusRing } from "@/lib/ui";

type DashboardShellProps = {
  area: DashboardArea;
  roleLabel: string;
  userName: string;
  dashboardHref: string;
  children: ReactNode;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function DashboardShell({ area, roleLabel, userName, dashboardHref, children }: DashboardShellProps) {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    sheet?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key !== "Tab" || !sheet) return;
      const focusable = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  const sidebarProps = { area, roleLabel, userName, dashboardHref };

  return (
    <div className="flex min-h-dvh bg-surface">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-paper lg:block">
        <div className="sticky top-0 h-dvh">
          <DashboardSidebar {...sidebarProps} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center justify-between border-b border-border bg-paper px-4 sm:px-6 lg:hidden">
          <BrandMark size="sm" />
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Open dashboard menu"
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
            className={clsx("flex size-11 items-center justify-center rounded-md text-ink hover:bg-surface", focusRing)}
          >
            <Menu aria-hidden="true" className="size-6" />
          </button>
        </div>

        <main id="main-content" className="flex-1 bg-surface p-6 lg:p-10">
          {children}
        </main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div aria-hidden="true" className="absolute inset-0 bg-ink/40" onClick={() => close(true)} />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard menu"
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-border bg-paper shadow-xl motion-safe:animate-fade-up"
          >
            <button
              type="button"
              aria-label="Close dashboard menu"
              onClick={() => close(true)}
              className={clsx(
                "absolute top-4 right-4 flex size-10 items-center justify-center rounded-md text-ink hover:bg-surface",
                focusRing,
              )}
            >
              <X aria-hidden="true" className="size-5" />
            </button>
            <DashboardSidebar {...sidebarProps} onNavigate={() => close(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
