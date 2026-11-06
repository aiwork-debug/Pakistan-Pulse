"use client";

import { clsx } from "clsx";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccountMenu } from "@/components/layout/account-menu";
import { BrandMark } from "@/components/layout/brand-mark";
import { MobileNavPanel, type NavLink } from "@/components/layout/mobile-nav-panel";
import { dashboardHrefFor } from "@/lib/can";
import type { Session } from "@/lib/session";
import { buttonSecondary, focusRing, underlineGrow } from "@/lib/ui";

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/news", label: "News" },
  { href: "/videos", label: "Videos" },
  { href: "/categories", label: "Categories" },
  { href: "/admins", label: "Admins" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const MOBILE_PANEL_ID = "mobile-nav-panel";
const SCROLL_THRESHOLD = 8;

type SiteNavbarProps = {
  session: Session | null;
};

export function SiteNavbar({ session }: SiteNavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = useCallback(
    (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href)),
    [pathname],
  );

  const dismiss = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  const closeOnNavigate = useCallback(() => setOpen(false), []);

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 border-b bg-paper motion-safe:transition-colors motion-safe:duration-200",
        scrolled || open ? "border-border" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-4 sm:px-6 lg:h-[72px] lg:px-8">
        <BrandMark />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "rounded-sm py-1 text-sm font-medium",
                      active ? "text-primary" : "text-ink hover:text-primary",
                      underlineGrow,
                      focusRing,
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <div className="hidden items-center gap-3 lg:flex">
              <Link
                href={dashboardHrefFor(session.role)}
                className={clsx("rounded-sm text-sm font-semibold text-ink hover:text-primary", underlineGrow, focusRing)}
              >
                Dashboard
              </Link>
              <AccountMenu session={session} />
            </div>
          ) : (
            <Link href="/login" className={clsx(buttonSecondary, "hidden h-10 lg:inline-flex")}>
              Sign in
            </Link>
          )}

          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls={MOBILE_PANEL_ID}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
            className={clsx("flex size-11 items-center justify-center rounded-md text-ink hover:bg-surface lg:hidden", focusRing)}
          >
            {open ? <X aria-hidden="true" className="size-6" /> : <Menu aria-hidden="true" className="size-6" />}
          </button>
        </div>
      </div>

      <MobileNavPanel
        id={MOBILE_PANEL_ID}
        open={open}
        links={NAV_LINKS}
        isActive={isActive}
        session={session}
        onDismiss={dismiss}
        onNavigate={closeOnNavigate}
      />
    </header>
  );
}
