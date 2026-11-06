import type { Metadata } from "next";
import { AdminsTable } from "@/components/dashboard/admins-table";
import { InviteAdminForm } from "@/components/dashboard/invite-admin-form";
import { StatCard } from "@/components/dashboard/stat-card";
import { can } from "@/lib/can";
import { MAX_ACTIVE_ADMINS, getAdminRows, getControlStats } from "@/lib/dashboard-data";
import { requirePageRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Control",
  robots: { index: false, follow: false },
};

export default async function ControlPage() {
  const session = await requirePageRole("SUPER_ADMIN");

  const [stats, admins] = await Promise.all([getControlStats(session), getAdminRows(session)]);
  const canManage = can(session.role, "manage:admins");

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-sans text-2xl font-semibold text-ink">Overview</h1>
        <p className="text-sm text-muted">Admins and publishing across Pulse. Admins publish their own stories directly.</p>
      </header>

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active admins" value={`${stats.activeAdmins} of ${MAX_ACTIVE_ADMINS}`} />
        <StatCard label="Suspended admins" value={stats.suspendedAdmins} />
        <StatCard label="Admin profiles" value={stats.totalAdmins} hint="All profiles with the admin role" />
        <StatCard label="Published stories" value={stats.publishedPosts} />
      </section>

      <section aria-labelledby="admins-heading" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="admins-heading" className="text-lg font-semibold text-ink">
            Admins
          </h2>
          <p className="text-sm text-muted">Maximum {MAX_ACTIVE_ADMINS} active admins. The limit is enforced on the server.</p>
        </div>
        <AdminsTable admins={admins} canManage={canManage} />
      </section>

      {canManage ? (
        <section aria-labelledby="invite-heading" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="invite-heading" className="text-lg font-semibold text-ink">
              Invite an admin
            </h2>
            <p className="text-sm text-muted">They receive an email to set their password, then sign in at /login.</p>
          </div>
          <InviteAdminForm limitReached={stats.activeAdmins >= MAX_ACTIVE_ADMINS} />
        </section>
      ) : null}
    </div>
  );
}
