import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { dashboardHrefFor, roleLabel } from "@/lib/can";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** ADMIN only. Anonymous visitors go to /login; every other role (including SUPER_ADMIN) goes to /403. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/403");

  return (
    <DashboardShell
      area="admin"
      roleLabel={roleLabel(session.role)}
      userName={session.name}
      dashboardHref={dashboardHrefFor(session.role)}
    >
      {children}
    </DashboardShell>
  );
}
