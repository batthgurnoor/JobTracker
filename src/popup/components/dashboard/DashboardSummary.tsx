import type { DashboardStats } from "../../../lib/dashboardStats";
import { SummaryChip } from "./SummaryChip";
import { StatusBreakdown } from "./StatusBreakdown";

type DashboardSummaryProps = {
  stats: DashboardStats;
  loading?: boolean;
};

export function DashboardSummary({ stats, loading }: DashboardSummaryProps) {
  return (
    <section
      className="rounded-xl border border-slate-200/90 bg-gradient-to-b from-slate-50/95 to-white px-2.5 py-2 shadow-sm ring-1 ring-slate-900/[0.03]"
      aria-label="Job tracker summary"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Dashboard
        </h2>
        {loading ? (
          <span className="text-[10px] text-slate-400">Updating…</span>
        ) : null}
      </div>

      <div className="mb-1.5 flex flex-wrap gap-1">
        <SummaryChip label="Total" value={stats.total} variant="muted" />
        <SummaryChip label="Due today" value={stats.followUpToday} variant="amber" />
        <SummaryChip label="Overdue" value={stats.followUpOverdue} variant="red" />
      </div>

      <StatusBreakdown counts={stats.statusCounts} />
    </section>
  );
}
