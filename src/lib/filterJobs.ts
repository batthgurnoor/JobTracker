import { JOB_STATUSES, type Job, type JobStatus } from "../types/job";

export type JobSortOption = "newest" | "oldest" | "company" | "status";

export type JobStatusFilter = "all" | JobStatus;

const STATUS_ORDER = new Map(JOB_STATUSES.map((status, index) => [status, index]));

function matchesSearch(job: Job, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  const haystack = [job.jobTitle, job.company, job.location, job.salary, job.notes]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function matchesStatus(job: Job, statusFilter: JobStatusFilter): boolean {
  if (statusFilter === "all") {
    return true;
  }
  return job.status === statusFilter;
}

function compareByDateSaved(a: Job, b: Job, direction: "asc" | "desc"): number {
  const aTime = Date.parse(a.dateSaved) || 0;
  const bTime = Date.parse(b.dateSaved) || 0;
  return direction === "desc" ? bTime - aTime : aTime - bTime;
}

function compareByCompany(a: Job, b: Job): number {
  const aCompany = a.company.trim().toLowerCase() || a.jobTitle.trim().toLowerCase();
  const bCompany = b.company.trim().toLowerCase() || b.jobTitle.trim().toLowerCase();
  return aCompany.localeCompare(bCompany);
}

function compareByStatus(a: Job, b: Job): number {
  const aIndex = STATUS_ORDER.get(a.status) ?? 0;
  const bIndex = STATUS_ORDER.get(b.status) ?? 0;
  if (aIndex !== bIndex) {
    return aIndex - bIndex;
  }
  return compareByDateSaved(a, b, "desc");
}

export function filterAndSortJobs(
  jobs: Job[],
  searchQuery: string,
  statusFilter: JobStatusFilter,
  sortOption: JobSortOption
): Job[] {
  const filtered = jobs.filter(
    (job) => matchesSearch(job, searchQuery) && matchesStatus(job, statusFilter)
  );

  const sorted = [...filtered];
  switch (sortOption) {
    case "oldest":
      sorted.sort((a, b) => compareByDateSaved(a, b, "asc"));
      break;
    case "company":
      sorted.sort(compareByCompany);
      break;
    case "status":
      sorted.sort(compareByStatus);
      break;
    case "newest":
    default:
      sorted.sort((a, b) => compareByDateSaved(a, b, "desc"));
      break;
  }

  return sorted;
}
