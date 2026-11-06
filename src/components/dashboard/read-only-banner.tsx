import { Lock } from "lucide-react";
import type { ReactNode } from "react";

type ReadOnlyBannerProps = {
  children: ReactNode;
};

export function ReadOnlyBanner({ children }: ReadOnlyBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-l-4 border-border border-l-primary bg-primary/5 px-4 py-3 text-sm text-ink">
      <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
      <p>{children}</p>
    </div>
  );
}
