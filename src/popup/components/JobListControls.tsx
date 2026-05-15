import { JOB_STATUSES } from "../../types/job";
import type { JobSortOption, JobStatusFilter } from "../../lib/filterJobs";

type JobListControlsProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: JobStatusFilter;
  onStatusFilterChange: (value: JobStatusFilter) => void;
  sortOption: JobSortOption;
  onSortChange: (value: JobSortOption) => void;
  visibleCount: number;
  totalCount: number;
  disabled?: boolean;
};

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60";

export function JobListControls({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOption,
  onSortChange,
  visibleCount,
  totalCount,
  disabled = false
}: JobListControlsProps) {
  return (
    <div className="mb-2 space-y-1.5">
      <label className="block text-[11px] font-medium text-slate-500">
        Search
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Title, company, location, notes…"
          disabled={disabled}
          className={`${inputClass} mt-0.5`}
        />
      </label>

      <div className="grid grid-cols-2 gap-1.5">
        <label className="block text-[11px] font-medium text-slate-500">
          Status
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as JobStatusFilter)}
            disabled={disabled}
            className={`${inputClass} mt-0.5`}
          >
            <option value="all">All statuses</option>
            {JOB_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] font-medium text-slate-500">
          Sort
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as JobSortOption)}
            disabled={disabled}
            className={`${inputClass} mt-0.5`}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="company">Company A–Z</option>
            <option value="status">Status</option>
          </select>
        </label>
      </div>

      <p className="text-[11px] text-slate-500">
        Showing {visibleCount} of {totalCount} job{totalCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}
