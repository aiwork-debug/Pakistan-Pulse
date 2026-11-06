type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

/** A single real figure. No placeholder analytics are ever shown. */
export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-paper p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="text-3xl font-semibold text-ink">{value}</p>
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
