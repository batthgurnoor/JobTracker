import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { signOut } from "firebase/auth";
import { getAuthInstance, getFirestoreInstance } from "../../lib/firebase";
import { loadJobsForUser, saveJobForUser } from "../../lib/jobsFirestore";
import { formatAuthError, formatFirestoreError } from "../../lib/userFacingErrors";
import {
  DEFAULT_JOB_STATUS,
  JOB_STATUSES,
  type JobRecord,
  type JobStatus
} from "../../types/job";

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso || "—";
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

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

  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [showJobs, setShowJobs] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const refreshTabHint = useCallback(async () => {
    const snap = await readActiveTab();
    if (!snap) {
      setTabHint("Open a normal web page tab to capture the job link automatically.");
      return;
    }
    setTabHint(`From tab: ${snap.title ? snap.title.slice(0, 60) + (snap.title.length > 60 ? "…" : "") : snap.url}`);
  }, []);

  useEffect(() => {
    void refreshTabHint();
  }, [refreshTabHint]);

  const loadMyJobs = useCallback(async () => {
    setJobsError(null);
    setJobsLoading(true);
    try {
      const db = getFirestoreInstance();
      const list = await loadJobsForUser(db, user.uid);
      setJobs(list);
      setShowJobs(true);
    } catch (err) {
      setJobsError(formatFirestoreError(err));
    } finally {
      setJobsLoading(false);
    }
  }, [user.uid]);

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

      const jobTitle = snap.title.trim() || "Untitled job";
      const payload = {
        jobTitle,
        company: company.trim(),
        location: location.trim(),
        url: snap.url,
        status,
        notes: notes.trim(),
        dateSaved: new Date().toISOString()
      };

      const db = getFirestoreInstance();
      await saveJobForUser(db, user.uid, payload);
      setSuccessMessage("Job saved to your account.");
      if (showJobs) {
        await loadMyJobs();
      }
    } catch (err) {
      setSaveError(formatFirestoreError(err));
    } finally {
      setSaveLoading(false);
    }
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
        <p className="text-xs font-semibold text-slate-600">Job details (optional fields)</p>
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
          Status
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
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          disabled={saveLoading}
        >
          Refresh from current tab
        </button>

        <button
          type="button"
          onClick={() => void loadMyJobs()}
          disabled={jobsLoading}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {jobsLoading ? "Loading jobs..." : "View my saved jobs"}
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

      {jobsError ? (
        <p className="rounded-md bg-red-50 px-2 py-1.5 text-sm text-red-700" role="alert">
          {jobsError}
        </p>
      ) : null}

      {showJobs ? (
        <section className="border-t border-slate-200 pt-3">
          <h2 className="mb-2 text-sm font-semibold text-slate-600">Your jobs ({jobs.length})</h2>
          {jobs.length === 0 ? (
            <p className="text-sm text-slate-500">No jobs saved yet.</p>
          ) : (
            <ul className="max-h-52 space-y-2 overflow-y-auto pr-1">
              {jobs.map((job) => (
                <li key={job.id} className="rounded-md border border-slate-100 bg-white p-2 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">{job.jobTitle}</p>
                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium uppercase text-blue-700">
                      {job.status}
                    </span>
                  </div>
                  {(job.company || job.location) && (
                    <p className="mt-1 text-xs text-slate-600">
                      {[job.company, job.location].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-500">Saved {formatShortDate(job.dateSaved)}</p>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block truncate text-xs text-blue-700 hover:underline"
                  >
                    {job.url}
                  </a>
                  {job.notes ? (
                    <p className="mt-1 line-clamp-2 border-t border-slate-100 pt-1 text-xs text-slate-600">
                      {job.notes}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
