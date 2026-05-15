import { useState, type ReactNode } from "react";
import { JOB_STATUSES, type Job, type JobStatus } from "../../types/job";

type JobCardProps = {
  job: Job;
  onStatusChange: (jobId: string, status: JobStatus) => Promise<void>;
  onDelete: (jobId: string) => Promise<void>;
};

function formatDateSaved(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso || "—";
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function JobCard({ job, onStatusChange, onDelete }: JobCardProps) {
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleStatusChange(nextStatus: JobStatus) {
    if (nextStatus === job.status) {
      return;
    }
    setActionError(null);
    setStatusLoading(true);
    try {
      await onStatusChange(job.id, nextStatus);
    } catch {
      setActionError("Could not update status.");
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleDelete() {
    setActionError(null);
    setDeleteLoading(true);
    try {
      await onDelete(job.id);
    } catch {
      setActionError("Could not delete this job.");
    } finally {
      setDeleteLoading(false);
    }
  }

  const isBusy = statusLoading || deleteLoading;

  return (
    <li className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{job.jobTitle}</h3>

      <dl className="mt-2 space-y-1.5 text-xs">
        <Field label="Company" value={job.company || "—"} />
        <Field label="Location" value={job.location || "—"} />
        <Field label="URL">
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-blue-700 hover:underline"
          >
            {job.url}
          </a>
        </Field>
        <Field label="Saved" value={formatDateSaved(job.dateSaved)} />
        <Field label="Status">
          <select
            value={job.status}
            onChange={(e) => void handleStatusChange(e.target.value as JobStatus)}
            disabled={isBusy}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {JOB_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </dl>

      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={isBusy}
        className="mt-3 w-full rounded-md border border-red-200 px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {deleteLoading ? "Deleting..." : "Delete"}
      </button>

      {statusLoading ? (
        <p className="mt-1 text-[11px] text-slate-500">Updating status…</p>
      ) : null}

      {actionError ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}
    </li>
  );
}

function Field({
  label,
  value,
  children
}: {
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <FieldRow label={label}>
      {children ?? <span className="text-slate-700">{value}</span>}
    </FieldRow>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-14 shrink-0 font-medium text-slate-500">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}
