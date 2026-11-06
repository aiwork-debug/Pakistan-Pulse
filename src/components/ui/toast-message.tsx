import { clsx } from "clsx";
import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "success" | "error" | "warning";

type ToastMessageProps = {
  tone: Tone;
  role?: "status" | "alert";
  title?: string;
  children: ReactNode;
  className?: string;
  id?: string;
};

const ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
} as const;

/**
 * Inline message. Only brand colors: success uses primary teal; errors and warnings use
 * ink with an icon and a left border instead of a new hue.
 */
export function ToastMessage({
  tone,
  role = tone === "error" ? "alert" : "status",
  title,
  children,
  className,
  id,
}: ToastMessageProps) {
  const Icon = ICONS[tone];

  return (
    <div
      id={id}
      role={role}
      className={clsx(
        "flex items-start gap-3 rounded-md border border-l-4 px-4 py-3 text-sm text-ink",
        tone === "success" ? "border-primary/30 border-l-primary bg-primary/5" : "border-border border-l-ink bg-surface",
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={clsx("mt-0.5 size-4 shrink-0", tone === "success" ? "text-primary" : "text-ink")}
      />
      <div className="flex flex-col gap-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
