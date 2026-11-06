"use client";

import { clsx } from "clsx";
import { LayoutDashboard, LogOut, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { avatarPhotoFor } from "@/lib/avatars";
import { dashboardHrefFor, roleLabel } from "@/lib/can";
import { gradientClass } from "@/lib/gradients";
import type { Session } from "@/lib/session";
import { focusRing } from "@/lib/ui";

type AccountMenuProps = {
  session: Session;
};

const itemClass = clsx(
  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-surface",
  focusRing,
);

export function AccountMenu({ session }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const photoUrl = avatarPhotoFor(session.username);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account menu for ${session.name}`}
        onClick={() => setOpen((value) => !value)}
        className={clsx(
          "relative flex size-10 items-center justify-center overflow-hidden rounded-full bg-linear-to-br text-sm font-semibold text-paper",
          gradientClass(session.avatarGradient),
          focusRing,
        )}
      >
        {photoUrl ? (
          <Image src={photoUrl} alt="" fill sizes="40px" className="object-cover" />
        ) : (
          session.initials
        )}
      </button>

      <div
        id={menuId}
        hidden={!open}
        className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-border bg-paper p-2 shadow-lg"
      >
        <div className="border-b border-border px-3 pt-1 pb-3">
          <p className="text-sm font-semibold text-ink">{session.name}</p>
          <p className="text-sm text-muted">{roleLabel(session.role)}</p>
        </div>
        <ul className="flex flex-col gap-1 pt-2">
          <li>
            <Link href={dashboardHrefFor(session.role)} className={itemClass} onClick={() => setOpen(false)}>
              <LayoutDashboard aria-hidden="true" className="size-4 text-muted" />
              My dashboard
            </Link>
          </li>
          <li>
            <Link href="/account/profile" className={itemClass} onClick={() => setOpen(false)}>
              <User aria-hidden="true" className="size-4 text-muted" />
              Profile
            </Link>
          </li>
          <li>
            <form action={logoutAction}>
              <button type="submit" className={itemClass}>
                <LogOut aria-hidden="true" className="size-4 text-muted" />
                Log out
              </button>
            </form>
          </li>
        </ul>
      </div>
    </div>
  );
}
