import { clsx } from "clsx";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div aria-hidden="true" className={clsx("rounded-md bg-border motion-safe:animate-pulse", className)} />
  );
}
