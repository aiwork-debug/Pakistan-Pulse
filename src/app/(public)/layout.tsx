import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { getCategories } from "@/lib/data";
import { getSession } from "@/lib/session";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [session, categories] = await Promise.all([getSession(), getCategories()]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNavbar session={session} />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <SiteFooter categories={categories} />
    </div>
  );
}
