"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { useEffect } from "react";
import { logoutAction } from "@/app/actions/auth";
import { dashboardHrefFor } from "@/lib/can";
import type { Session } from "@/lib/session";
import { buttonPrimary, focusRing } from "@/lib/ui";

export type NavLink = { href: string; label: string };

type MobileNavPanelProps = {
  id: string;
  open: boolean;
  links: NavLink[];
  isActive: (href: string) => boolean;
  session: Session | null;
  /** Escape: the parent closes the panel and returns focus to the toggle. */
  onDismiss: () => void;
  /** A link was followed. */
  onNavigate: () => void;
};

const STAGGER_MS = 60;

/** Full-screen sheet that slides down; links fade in one after another (60ms apart). */
export function MobileNavPanel({
  id,
  open,
  links,
  isActive,
  session,
  onDismiss,
  onNavigate,
}: MobileNavPanelProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onDismiss]);

  const extraLinks: NavLink[] = session
    ? [
        { href: dashboardHrefFor(session.role), label: "My dashboard" },
        { href: "/account/profile", label: "Profile" },
      ]
    : [];

  return (
    <div
      id={id}
      hidden={!open}
      className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-paper motion-safe:animate-sheet-down lg:hidden"
    >
      <nav aria-label="Mobile" className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-8 sm:px-6">
        <ul className="flex flex-col">
          {[...links, ...extraLinks].map((link, index) => {
            const active = isActive(link.href);
            return (
              <li
                key={link.href}
                className={clsx("border-b border-border", open && "motion-safe:animate-fade-up")}
                style={{ animationDelay: `${index * STAGGER_MS}ms` }}
              >
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                  className={clsx(
                    "block rounded-sm py-4 font-serif text-2xl font-semibold",
                    active ? "text-primary" : "text-ink hover:text-primary",
                    focusRing,
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {session ? (
          <form action={logoutAction}>
            <button type="submit" className={clsx(buttonPrimary, "w-full")}>
              Log out
            </button>
          </form>
        ) : (
          <Link href="/login" onClick={onNavigate} className={clsx(buttonPrimary, "w-full")}>
            Sign in
          </Link>
        )}
      </nav>
    </div>
  );
}
