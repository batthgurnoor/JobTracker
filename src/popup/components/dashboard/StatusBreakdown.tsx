import { JOB_STATUSES, type JobStatus } from "../../../types/job";

type StatusBreakdownProps = {
  counts: Record<JobStatus, number>;
};

export function StatusBreakdown({ counts }: StatusBreakdownProps) {
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] leading-tight text-slate-600">
      {JOB_STATUSES.map((status) => (
        <span key={status}>
          <span className="font-medium text-slate-700">{status}</span>
          <span className="tabular-nums text-slate-500"> {counts[status]}</span>
        </span>
      ))}
    </div>
  );
}
