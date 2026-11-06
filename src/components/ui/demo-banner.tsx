import { FlaskConical } from "lucide-react";
import { isDemoMode } from "@/lib/demo/mode";

/** Thin notice shown on every page while the app runs on dummy data instead of Supabase. */
export function DemoBanner() {
  if (!isDemoMode()) return null;
  return (
    <div role="note" className="border-b border-border bg-surface">
      <p className="mx-auto flex max-w-[1280px] items-center gap-2 px-4 py-2 text-sm text-ink sm:px-6 lg:px-8">
        <FlaskConical aria-hidden="true" className="size-4 shrink-0 text-primary" />
        <span>
          <strong className="font-semibold">Demo mode:</strong> showing dummy data. Add the Supabase
          keys to <code className="rounded bg-paper px-1">.env.local</code> to use the real database.
        </span>
      </p>
    </div>
  );
}
