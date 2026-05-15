import { useState, type FormEvent } from "react";
import { formatFirestoreError } from "../../lib/userFacingErrors";
import { toDateInputValue } from "../../lib/followUpDate";
import { updateJobForUser } from "../../services/jobService";
import { JOB_STATUSES, type Job, type JobStatus } from "../../types/job";

type JobEditViewProps = {
  job: Job;
  userId: string;
  onBack: () => void;
  onSaved: (job: Job) => void;
};

const fieldClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60";

export function JobEditView({ job, userId, onBack, onSaved }: JobEditViewProps) {
  const [jobTitle, setJobTitle] = useState(job.jobTitle);
  const [company, setCompany] = useState(job.company);
  const [location, setLocation] = useState(job.location);
  const [salary, setSalary] = useState(job.salary);
  const [status, setStatus] = useState<JobStatus>(job.status);
  const [notes, setNotes] = useState(job.notes);
  const [followUpDate, setFollowUpDate] = useState(toDateInputValue(job.followUpDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const trimmedTitle = jobTitle.trim();
      if (!trimmedTitle) {
        setError("Job title is required.");
        return;
      }

      await updateJobForUser(userId, job.id, {
        jobTitle: trimmedTitle,
        company,
        location,
        salary,
        status,
        notes,
        followUpDate
      });

      onSaved({
        ...job,
        jobTitle: trimmedTitle,
        company: company.trim(),
        location: location.trim(),
        salary: salary.trim(),
        status,
        notes: notes.trim(),
        followUpDate: toDateInputValue(followUpDate),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      setError(formatFirestoreError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-800">Edit job</h2>
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
        >
          Back
        </button>
      </div>

      <form className="space-y-2" onSubmit={handleSubmit}>
        <label className="block text-xs font-medium text-slate-600">
          Job title
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            required
            disabled={saving}
            className={fieldClass}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Company
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={saving}
            className={fieldClass}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Location
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={saving}
            className={fieldClass}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Salary
          <input
            type="text"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="$120k – $150k"
            disabled={saving}
            className={fieldClass}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as JobStatus)}
            disabled={saving}
            className={fieldClass}
          >
            {JOB_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Follow-up date
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            disabled={saving}
            className={fieldClass}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            disabled={saving}
            className={`${fieldClass} resize-none`}
          />
        </label>

        {error ? (
          <p className="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving changes..." : "Save changes"}
        </button>
      </form>

      <p className="mt-2 truncate text-[11px] text-slate-400" title={job.url}>
        {job.url}
      </p>
    </section>
  );
}
