import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { signOut } from "firebase/auth";
import { getAuthInstance } from "../../lib/firebase";
import { fetchExtractedJobFromActiveTab } from "../../lib/fetchActiveTabJob";
import { formatAuthError, formatFirestoreError } from "../../lib/userFacingErrors";
import {
  createJobForUser,
  deleteJobForUser,
  DuplicateJobUrlError,
  fetchJobsForUser,
  updateJobStatusForUser
} from "../../services/jobService";
import { DEFAULT_JOB_STATUS, JOB_STATUSES, type Job, type JobStatus } from "../../types/job";
import type { ExtractedJobPage } from "../../types/extractedJobPage";
import { computeDashboardStats } from "../../lib/dashboardStats";
import { DashboardSummary } from "./dashboard/DashboardSummary";
import { JobBackupControls } from "./JobBackupControls";
import { JobEditView } from "./JobEditView";
import { JobList } from "./JobList";

type JobPanelProps = {
  user: User;
};

function extractionHint(method: ExtractedJobPage["extractionMethod"]): string {
  switch (method) {
    case "linkedin":
      return "Filled from LinkedIn page";
    case "indeed":
      return "Filled from Indeed page";
    case "generic":
      return "Filled from page content";
    default:
      return "Using tab title and URL";
  }
}

export function JobPanel({ user }: JobPanelProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<JobStatus>(DEFAULT_JOB_STATUS);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [tabHint, setTabHint] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState("");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [extractLoading, setExtractLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setJobsError(null);
    setJobsLoading(true);
    try {
      const list = await fetchJobsForUser(user.uid);
      setJobs(list);
    } catch (err) {
      setJobsError(formatFirestoreError(err));
    } finally {
      setJobsLoading(false);
    }
  }, [user.uid]);

  const applyExtractedPage = useCallback((extracted: ExtractedJobPage | null) => {
    if (!extracted) {
      setTabHint("Open a normal web page tab to capture job details.");
      setPageUrl("");
      return;
    }

    setJobTitle(extracted.jobTitle);
    setCompany(extracted.company);
    setLocation(extracted.location);
    setPageUrl(extracted.url);
    setTabHint(extractionHint(extracted.extractionMethod));
  }, []);

  const refreshFromCurrentTab = useCallback(async () => {
    setExtractLoading(true);
    try {
      const extracted = await fetchExtractedJobFromActiveTab();
      applyExtractedPage(extracted);
    } finally {
      setExtractLoading(false);
    }
  }, [applyExtractedPage]);

  useEffect(() => {
    void loadJobs();
    void refreshFromCurrentTab();
  }, [loadJobs, refreshFromCurrentTab]);

  async function handleLogout() {
    setLogoutError(null);
    setLogoutLoading(true);
    try {
      await signOut(getAuthInstance());
    } catch (err) {
      setLogoutError(formatAuthError(err));
    } finally {
      setLogoutLoading(false);
    }
  }

  async function handleSaveJob() {
    setSaveError(null);
    setSuccessMessage(null);
    setSaveLoading(true);
    try {
      const extracted = await fetchExtractedJobFromActiveTab();
      if (!extracted) {
        setSaveError("Switch to a job posting in a regular browser tab, then try again.");
        return;
      }

      // Form values win when the user typed something; otherwise use scraped fields.
      const finalTitle = jobTitle.trim() || extracted.jobTitle || "Untitled job";
      const finalCompany = company.trim() || extracted.company;
      const finalLocation = location.trim() || extracted.location;
      const finalUrl = extracted.url || pageUrl;

      if (!finalUrl) {
        setSaveError("Could not read a URL from this tab.");
        return;
      }

      await createJobForUser(user.uid, {
        jobTitle: finalTitle,
        company: finalCompany,
        location: finalLocation,
        url: finalUrl,
        salary: salary.trim(),
        status,
        notes: notes.trim(),
        dateSaved: new Date().toISOString()
      });

      setSuccessMessage("Job saved to your account.");
      setJobTitle("");
      setCompany("");
      setLocation("");
      setSalary("");
      setNotes("");
      setStatus(DEFAULT_JOB_STATUS);
      setPageUrl("");
      setTabHint(null);
      await loadJobs();
      await refreshFromCurrentTab();
    } catch (err) {
      if (err instanceof DuplicateJobUrlError) {
        setSaveError(err.message);
      } else {
        setSaveError(formatFirestoreError(err));
      }
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleStatusChange(jobId: string, nextStatus: JobStatus) {
    await updateJobStatusForUser(user.uid, jobId, nextStatus);
    setJobs((current) =>
      current.map((job) => (job.id === jobId ? { ...job, status: nextStatus } : job))
    );
  }

  async function handleDelete(jobId: string) {
    await deleteJobForUser(user.uid, jobId);
    setJobs((current) => current.filter((job) => job.id !== jobId));
    if (editingJob?.id === jobId) {
      setEditingJob(null);
    }
  }

  function handleJobSaved(updated: Job) {
    setJobs((current) => current.map((job) => (job.id === updated.id ? updated : job)));
    setEditingJob(null);
  }

  const formDisabled = saveLoading || extractLoading || editingJob !== null;

  const dashboardStats = useMemo(() => computeDashboardStats(jobs), [jobs]);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">Signed in as</p>
          <p className="truncate text-sm font-medium text-slate-800">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={logoutLoading}
          className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {logoutLoading ? "Signing out..." : "Log out"}
        </button>
      </div>

      {logoutError ? (
        <p className="rounded-md bg-red-50 px-2 py-1.5 text-sm text-red-700" role="alert">
          {logoutError}
        </p>
      ) : null}

      {!editingJob ? (
        <DashboardSummary stats={dashboardStats} loading={jobsLoading} />
      ) : null}

      {!editingJob ? (
        <JobBackupControls
          jobs={jobs}
          userId={user.uid}
          disabled={jobsLoading}
          onAfterImport={loadJobs}
        />
      ) : null}

      {tabHint && !editingJob ? <p className="text-xs text-slate-500">{tabHint}</p> : null}
      {pageUrl && !editingJob ? (
        <p className="truncate text-[11px] text-slate-400" title={pageUrl}>
          {pageUrl}
        </p>
      ) : null}

      {editingJob ? (
        <JobEditView
          job={editingJob}
          userId={user.uid}
          onBack={() => setEditingJob(null)}
          onSaved={handleJobSaved}
        />
      ) : null}

      {!editingJob ? (
      <>
      <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2">
        <p className="text-xs font-semibold text-slate-600">Save a new job</p>
        <label className="block text-xs font-medium text-slate-600">
          Job title
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Software Engineer"
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={formDisabled}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Company
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Inc."
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={formDisabled}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Location
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Remote · San Francisco"
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={formDisabled}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Salary
          <input
            type="text"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="$120k – $150k"
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={formDisabled}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Status (for new saves)
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as JobStatus)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={formDisabled}
          >
            {JOB_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Recruiter, salary range, links…"
            rows={2}
            className="mt-1 w-full resize-none rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={formDisabled}
          />
        </label>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void handleSaveJob()}
          disabled={formDisabled}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveLoading ? "Saving job..." : "Save current job"}
        </button>
        <button
          type="button"
          onClick={() => void refreshFromCurrentTab()}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          disabled={formDisabled}
        >
          {extractLoading ? "Reading page..." : "Refresh from current tab"}
        </button>
      </div>

      {successMessage ? (
        <p className="rounded-md bg-emerald-50 px-2 py-1.5 text-sm text-emerald-800">{successMessage}</p>
      ) : null}

      {saveError ? (
        <p className="rounded-md bg-red-50 px-2 py-1.5 text-sm text-red-700" role="alert">
          {saveError}
        </p>
      ) : null}

      <JobList
        jobs={jobs}
        loading={jobsLoading}
        error={jobsError}
        onEdit={setEditingJob}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
      </>
      ) : null}
    </div>
  );
}
