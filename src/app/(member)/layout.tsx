import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { dashboardHrefFor, roleLabel } from "@/lib/can";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Account pages for any signed-in staff member. Anonymous visitors go to /login. */
export default async function MemberLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <DashboardShell
      area="member"
      roleLabel={roleLabel(session.role)}
      userName={session.name}
      dashboardHref={dashboardHrefFor(session.role)}
    >
      {children}
    </DashboardShell>
  );
}
