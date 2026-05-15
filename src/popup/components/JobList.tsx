import type { Job, JobStatus } from "../../types/job";
import { JobCard } from "./JobCard";

type JobListProps = {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  onStatusChange: (jobId: string, status: JobStatus) => Promise<void>;
  onDelete: (jobId: string) => Promise<void>;
};

export function JobList({ jobs, loading, error, onStatusChange, onDelete }: JobListProps) {
  return (
    <section className="border-t border-slate-200 pt-3">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">Your saved jobs</h2>

      {loading ? (
        <p className="text-sm text-slate-500">Loading your jobs…</p>
      ) : error ? (
        <p className="rounded-md bg-red-50 px-2 py-1.5 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-slate-500">No saved jobs yet.</p>
      ) : (
        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
