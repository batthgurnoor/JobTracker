import { useState } from "react";

type SavedJob = {
  title: string;
  url: string;
  savedAt: string;
};

const JOBS_STORAGE_KEY = "savedJobs";

function App() {
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [showSavedJobs, setShowSavedJobs] = useState(false);

  const saveCurrentJob = async () => {
    setStatusMessage("");

    try {
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });

      if (!activeTab?.url) {
        setStatusMessage("Could not find an active tab URL.");
        return;
      }

      const newJob: SavedJob = {
        title: activeTab.title || "Untitled Job Page",
        url: activeTab.url,
        savedAt: new Date().toISOString()
      };

      const result = await chrome.storage.local.get(JOBS_STORAGE_KEY);
      const existingJobs: SavedJob[] = result[JOBS_STORAGE_KEY] ?? [];

      await chrome.storage.local.set({
        [JOBS_STORAGE_KEY]: [newJob, ...existingJobs]
      });

      setStatusMessage("Job saved successfully.");
    } catch (error) {
      // Keep this message generic for beginners and avoid exposing raw runtime details.
      setStatusMessage("Failed to save the job. Please try again.");
      console.error("Error while saving job:", error);
    }
  };

  const loadSavedJobs = async () => {
    setIsLoadingJobs(true);
    setStatusMessage("");

    try {
      const result = await chrome.storage.local.get(JOBS_STORAGE_KEY);
      const jobs: SavedJob[] = result[JOBS_STORAGE_KEY] ?? [];
      setSavedJobs(jobs);
      setShowSavedJobs(true);
    } catch (error) {
      setStatusMessage("Could not load saved jobs.");
      console.error("Error while loading jobs:", error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  return (
    <main className="w-80 bg-white p-4 text-slate-800 shadow-md">
      <h1 className="mb-4 text-xl font-semibold">Job Tracker</h1>

      <div className="space-y-2">
        <button
          type="button"
          onClick={saveCurrentJob}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Save Current Job
        </button>

        <button
          type="button"
          onClick={loadSavedJobs}
          disabled={isLoadingJobs}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoadingJobs ? "Loading..." : "View Saved Jobs"}
        </button>
      </div>

      {statusMessage && (
        <p className="mt-3 rounded-md bg-emerald-50 px-2 py-1 text-sm text-emerald-700">
          {statusMessage}
        </p>
      )}

      {showSavedJobs && (
        <section className="mt-4 border-t border-slate-200 pt-3">
          <h2 className="mb-2 text-sm font-semibold text-slate-600">Saved Jobs</h2>
          {savedJobs.length === 0 ? (
            <p className="text-sm text-slate-500">No saved jobs yet.</p>
          ) : (
            <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {savedJobs.map((job, index) => (
                <li key={`${job.url}-${index}`} className="rounded-md bg-slate-50 p-2">
                  <p className="line-clamp-2 text-sm font-medium text-slate-800">
                    {job.title}
                  </p>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block truncate text-xs text-blue-700 hover:underline"
                  >
                    {job.url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}

export default App;
