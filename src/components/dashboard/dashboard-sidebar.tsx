"use client";

import { clsx } from "clsx";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MonitorSmartphone,
  Newspaper,
  ScrollText,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/layout/brand-mark";
import { focusRing } from "@/lib/ui";

export type DashboardArea = "member" | "admin" | "superadmin";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const NAV: Record<DashboardArea, NavItem[]> = {
  member: [
    { href: "/account", label: "Account", icon: LayoutDashboard, exact: true },
    { href: "/account/profile", label: "Profile", icon: User },
    { href: "/account/sessions", label: "Sessions", icon: MonitorSmartphone },
  ],
  admin: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/posts", label: "My posts", icon: FileText },
    { href: "/dashboard/media", label: "Media", icon: ImageIcon },
    { href: "/account/profile", label: "Profile", icon: User },
  ],
  superadmin: [
    { href: "/control", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/control/homepage", label: "Homepage", icon: Newspaper },
    { href: "/control/users", label: "Users (read-only)", icon: Users },
    { href: "/control/audit-log", label: "Audit log", icon: ScrollText },
    { href: "/account/profile", label: "Profile", icon: User },
  ],
};

type DashboardSidebarProps = {
  area: DashboardArea;
  roleLabel: string;
  userName: string;
  dashboardHref: string;
  onNavigate?: () => void;
};

const itemClass = clsx("flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium", focusRing);

export function DashboardSidebar({ area, roleLabel, userName, dashboardHref, onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname();
  const items =
    area === "member"
      ? [{ href: dashboardHref, label: "Dashboard", icon: LayoutDashboard, exact: true }, ...NAV.member.slice(1)]
      : NAV[area];

  return (
    <div className="flex h-full flex-col gap-8 p-6">
      <div className="flex flex-col gap-3">
        <BrandMark size="sm" />
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">{roleLabel}</p>
          <p className="text-sm text-muted">{userName}</p>
        </div>
      </div>

      <nav aria-label="Dashboard" className="flex-1">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                  className={clsx(
                    itemClass,
                    active ? "bg-primary/10 text-primary" : "text-ink hover:bg-surface hover:text-primary",
                  )}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-1 border-t border-border pt-4">
        <Link href="/" onClick={onNavigate} className={clsx(itemClass, "text-ink hover:bg-surface hover:text-primary")}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to site
        </Link>
        <form action={logoutAction}>
          <button type="submit" className={clsx(itemClass, "text-ink hover:bg-surface hover:text-primary")}>
            <LogOut aria-hidden="true" className="size-4" />
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
