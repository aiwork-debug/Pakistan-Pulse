import { clsx } from "clsx";
import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import type { Category } from "@/lib/types";
import { buttonPrimary, focusRing, inputBase, underlineGrow } from "@/lib/ui";

type SiteFooterProps = {
  categories: Category[];
};

const EXPLORE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/news", label: "News" },
  { href: "/videos", label: "Videos" },
  { href: "/categories", label: "Categories" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/policies/editorial", label: "Policies" },
];

const POLICY_LINKS = [
  { href: "/policies/editorial", label: "Editorial" },
  { href: "/policies/corrections", label: "Corrections" },
  { href: "/policies/privacy", label: "Privacy" },
  { href: "/policies/terms", label: "Terms" },
  { href: "/policies/cookies", label: "Cookies" },
];

const linkClass = clsx("rounded-sm text-sm text-muted hover:text-primary", underlineGrow, focusRing);

function LinkColumn({ id, title, links }: { id: string; title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-labelledby={id}>
      <h2 id={id} className="text-sm font-semibold text-ink">
        {title}
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter({ categories }: SiteFooterProps) {
  return (
    <footer className="border-t border-border bg-paper py-16">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-5">
            <BrandMark size="sm" />
            <p className="max-w-sm text-sm leading-6 text-muted">
              Independent news and long-form reporting on the economy, cities, technology,
              environment, education, and sport.
            </p>
            {/* No action yet. method="dialog" outside a <dialog> makes submitting a no-op. */}
            <form method="dialog" className="flex max-w-sm flex-col gap-2">
              <label htmlFor="footer-newsletter-email" className="text-sm font-semibold text-ink">
                Newsletter
              </label>
              <div className="flex gap-2">
                <input
                  id="footer-newsletter-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-describedby="footer-newsletter-note"
                  className={clsx(inputBase, "h-10 border-border text-sm")}
                />
                <button
                  type="button"
                  aria-disabled="true"
                  aria-describedby="footer-newsletter-note"
                  className={clsx(buttonPrimary, "h-10 px-4")}
                >
                  Subscribe
                </button>
              </div>
              <p id="footer-newsletter-note" className="text-sm text-muted">
                Subscriptions open soon.
              </p>
            </form>
          </div>

          <LinkColumn id="footer-explore" title="Explore" links={EXPLORE_LINKS} />
          <LinkColumn
            id="footer-categories"
            title="Categories"
            links={categories.filter((category) => !category.parentId).map((category) => ({
              href: `/news?category=${category.slug}`,
              label: category.name,
            }))}
          />
          <LinkColumn id="footer-company" title="Company" links={COMPANY_LINKS} />
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>© 2026 Pulse. All rights reserved.</p>
          <nav aria-label="Policies">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {POLICY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
