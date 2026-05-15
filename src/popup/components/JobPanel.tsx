import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { signOut } from "firebase/auth";
import { getAuthInstance } from "../../lib/firebase";
import { formatAuthError, formatFirestoreError } from "../../lib/userFacingErrors";
import {
  createJobForUser,
  deleteJobForUser,
  DuplicateJobUrlError,
  fetchJobsForUser,
  updateJobStatusForUser
} from "../../services/jobService";
import { DEFAULT_JOB_STATUS, JOB_STATUSES, type Job, type JobStatus } from "../../types/job";
import { JobList } from "./JobList";

async function readActiveTab(): Promise<{ title: string; url: string } | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    return null;
  }
  const url = tab.url;
  if (url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:")) {
    return null;
  }
  return { title: tab.title ?? "", url };
}

type JobPanelProps = {
  user: User;
};

export function JobPanel({ user }: JobPanelProps) {
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<JobStatus>(DEFAULT_JOB_STATUS);
  const [tabHint, setTabHint] = useState<string | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

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

  const refreshTabHint = useCallback(async () => {
    const snap = await readActiveTab();
    if (!snap) {
      setTabHint("Open a normal web page tab to capture the job link automatically.");
      return;
    }
    setTabHint(
      `From tab: ${snap.title ? snap.title.slice(0, 60) + (snap.title.length > 60 ? "…" : "") : snap.url}`
    );
  }, []);

  useEffect(() => {
    void refreshTabHint();
    void loadJobs();
  }, [refreshTabHint, loadJobs]);

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
      const snap = await readActiveTab();
      if (!snap) {
        setSaveError("Switch to a job posting in a regular browser tab, then try again.");
        return;
      }

      await createJobForUser(user.uid, {
        jobTitle: snap.title.trim() || "Untitled job",
        company: company.trim(),
        location: location.trim(),
        url: snap.url,
        status,
        notes: notes.trim(),
        dateSaved: new Date().toISOString()
      });

      setSuccessMessage("Job saved to your account.");
      setCompany("");
      setLocation("");
      setNotes("");
      setStatus(DEFAULT_JOB_STATUS);
      await loadJobs();
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
  }

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

      {tabHint ? <p className="text-xs text-slate-500">{tabHint}</p> : null}

      <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2">
        <p className="text-xs font-semibold text-slate-600">Save a new job</p>
        <label className="block text-xs font-medium text-slate-600">
          Company
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Inc."
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={saveLoading}
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
            disabled={saveLoading}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Status (for new saves)
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as JobStatus)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={saveLoading}
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
            disabled={saveLoading}
          />
        </label>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void handleSaveJob()}
          disabled={saveLoading}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveLoading ? "Saving job..." : "Save current job"}
        </button>
        <button
          type="button"
          onClick={() => void refreshTabHint()}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          disabled={saveLoading}
        >
          Refresh from current tab
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
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  );
}
