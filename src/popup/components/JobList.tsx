import { useMemo, useState } from "react";
import {
  filterAndSortJobs,
  type JobSortOption,
  type JobStatusFilter
} from "../../lib/filterJobs";
import type { Job, JobStatus } from "../../types/job";
import { JobCard } from "./JobCard";
import { JobListControls } from "./JobListControls";

type JobListProps = {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  onEdit: (job: Job) => void;
  onStatusChange: (jobId: string, status: JobStatus) => Promise<void>;
  onDelete: (jobId: string) => Promise<void>;
};

export function JobList({ jobs, loading, error, onEdit, onStatusChange, onDelete }: JobListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>("all");
  const [sortOption, setSortOption] = useState<JobSortOption>("newest");

  const visibleJobs = useMemo(
    () => filterAndSortJobs(jobs, searchQuery, statusFilter, sortOption),
    [jobs, searchQuery, statusFilter, sortOption]
  );

  const controlsDisabled = loading || jobs.length === 0;

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
        <>
          <JobListControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortOption={sortOption}
            onSortChange={setSortOption}
            visibleCount={visibleJobs.length}
            totalCount={jobs.length}
            disabled={controlsDisabled}
          />

          {visibleJobs.length === 0 ? (
            <p className="text-sm text-slate-500">No jobs match your search or filter.</p>
          ) : (
            <ul className="max-h-52 space-y-2 overflow-y-auto pr-1">
              {visibleJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onEdit={onEdit}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
