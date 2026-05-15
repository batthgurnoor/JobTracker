import { useState, type ReactNode } from "react";
import { formatFollowUpLabel } from "../../lib/followUpDate";
import { JOB_STATUSES, type Job, type JobStatus } from "../../types/job";
import { FollowUpBadge } from "./FollowUpBadge";

type JobCardProps = {
  job: Job;
  onEdit: (job: Job) => void;
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

export function JobCard({ job, onEdit, onStatusChange, onDelete }: JobCardProps) {
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
  const followUpLabel = formatFollowUpLabel(job.followUpDate);

  return (
    <li className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 flex-1 text-sm font-semibold text-slate-900">{job.jobTitle}</h3>
        <FollowUpBadge followUpDate={job.followUpDate} />
      </div>

      <dl className="mt-2 space-y-1.5 text-xs">
        <Field label="Company" value={job.company || "—"} />
        <Field label="Location" value={job.location || "—"} />
        {job.salary ? <Field label="Salary" value={job.salary} /> : null}
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
        {followUpLabel ? <Field label="Follow-up" value={followUpLabel} /> : null}
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
        {job.notes ? (
          <Field label="Notes">
            <span className="line-clamp-2 text-slate-700">{job.notes}</span>
          </Field>
        ) : null}
      </dl>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEdit(job)}
          disabled={isBusy}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={isBusy}
          className="rounded-md border border-red-200 px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleteLoading ? "Deleting..." : "Delete"}
        </button>
      </div>

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
