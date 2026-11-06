import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

type ErrorStateProps = {
  title: string;
  description?: string;
  /** Action buttons or links. */
  children?: ReactNode;
  /** Extra detail shown in small muted text, such as an error digest. */
  detail?: string;
};

export function ErrorState({ title, description, children, detail }: ErrorStateProps) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 py-16 text-center lg:py-24">
      <CircleAlert aria-hidden="true" className="size-10 text-ink" />
      <h1 className="font-serif text-4xl leading-tight font-bold text-ink">{title}</h1>
      {description ? <p className="text-lg leading-7 text-muted">{description}</p> : null}
      {children ? <div className="flex flex-wrap justify-center gap-3">{children}</div> : null}
      {detail ? <p className="text-sm text-muted">{detail}</p> : null}
    </div>
  );
}
