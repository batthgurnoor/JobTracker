import {
  DEFAULT_JOB_STATUS,
  JOB_STATUSES,
  type Job,
  type JobCreateInput,
  type JobStatus
} from "../types/job";
import { toDateInputValue } from "./followUpDate";

export const JOB_BACKUP_SCHEMA_VERSION = 1 as const;

export type JobBackupRecord = Omit<Job, "id" | "updatedAt">;

export type JobBackupFile = {
  schemaVersion: typeof JOB_BACKUP_SCHEMA_VERSION;
  app: "job-tracker-extension";
  exportedAt: string;
  jobs: JobBackupRecord[];
};

function isJobStatus(value: unknown): value is JobStatus {
  return typeof value === "string" && (JOB_STATUSES as readonly string[]).includes(value);
}

function coerceRecord(raw: unknown): JobCreateInput | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const row = raw as Record<string, unknown>;

  const url = typeof row.url === "string" ? row.url.trim() : "";
  if (!url) {
    return null;
  }
  try {
    void new URL(url);
  } catch {
    return null;
  }

  const jobTitleRaw = typeof row.jobTitle === "string" ? row.jobTitle.trim() : "";
  const jobTitle = jobTitleRaw || "Imported job";

  const status = isJobStatus(row.status) ? row.status : DEFAULT_JOB_STATUS;

  const dateSaved =
    typeof row.dateSaved === "string" && row.dateSaved.trim()
      ? row.dateSaved.trim()
      : new Date().toISOString();

  const followUp =
    typeof row.followUpDate === "string" ? toDateInputValue(row.followUpDate) : "";

  return {
    jobTitle,
    company: typeof row.company === "string" ? row.company.trim() : "",
    location: typeof row.location === "string" ? row.location.trim() : "",
    url,
    salary: typeof row.salary === "string" ? row.salary.trim() : "",
    status,
    notes: typeof row.notes === "string" ? row.notes.trim() : "",
    followUpDate: followUp || undefined,
    dateSaved
  };
}

function extractJobsArray(parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && typeof parsed === "object" && "jobs" in parsed) {
    const jobs = (parsed as { jobs?: unknown }).jobs;
    return Array.isArray(jobs) ? jobs : null;
  }
  return null;
}

export type ValidateBackupResult =
  | { ok: true; jobs: JobCreateInput[]; rejectedRowNumbers: number[] }
  | { ok: false; error: string };

export function validateBackupPayload(parsed: unknown): ValidateBackupResult {
  if (parsed === null || parsed === undefined) {
    return { ok: false, error: "File is empty or not valid JSON." };
  }

  const rows = extractJobsArray(parsed);
  if (rows === null) {
    return {
      ok: false,
      error: 'Expected an array of jobs or an object with a "jobs" array.'
    };
  }

  const jobs: JobCreateInput[] = [];
  const rejectedRowNumbers: number[] = [];

  rows.forEach((raw, index) => {
    const coerced = coerceRecord(raw);
    if (coerced) {
      jobs.push(coerced);
    } else {
      rejectedRowNumbers.push(index + 1);
    }
  });

  if (rows.length === 0) {
    return { ok: true, jobs: [], rejectedRowNumbers: [] };
  }

  if (jobs.length === 0) {
    const preview = rejectedRowNumbers.slice(0, 8).join(", ");
    const suffix = rejectedRowNumbers.length > 8 ? "…" : "";
    return {
      ok: false,
      error: `No valid jobs to import. Fix rows ${preview}${suffix} (each needs a valid URL).`
    };
  }

  return { ok: true, jobs, rejectedRowNumbers };
}

export function buildBackupFile(jobs: Job[]): JobBackupFile {
  const records: JobBackupRecord[] = jobs.map(({ id: _id, updatedAt: _u, ...rest }) => rest);

  return {
    schemaVersion: JOB_BACKUP_SCHEMA_VERSION,
    app: "job-tracker-extension",
    exportedAt: new Date().toISOString(),
    jobs: records
  };
}

export function downloadJobsBackup(jobs: Job[]): void {
  const doc = buildBackupFile(jobs);
  const json = JSON.stringify(doc, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `job-tracker-jobs-${stamp}.json`;
  anchor.rel = "noopener";
  anchor.click();
  URL.revokeObjectURL(url);
}
