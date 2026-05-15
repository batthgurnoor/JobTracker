/** Compact metric pill for dashboard summary rows. */
type SummaryChipProps = {
  label: string;
  value: number | string;
  variant?: "default" | "amber" | "red" | "muted";
};

const variantClass: Record<NonNullable<SummaryChipProps["variant"]>, string> = {
  default: "border-slate-200 bg-white text-slate-800",
  muted: "border-slate-100 bg-slate-50 text-slate-600",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  red: "border-red-200 bg-red-50 text-red-900"
};

export function SummaryChip({ label, value, variant = "default" }: SummaryChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${variantClass[variant]}`}
      title={`${label}: ${value}`}
    >
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold tabular-nums text-slate-900">{value}</span>
    </span>
  );
}
