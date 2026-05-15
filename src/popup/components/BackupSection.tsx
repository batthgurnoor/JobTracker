import { useCallback, useRef, useState, type ChangeEvent } from "react";
import { downloadJobsBackup, validateBackupPayload } from "../../lib/jobBackup";
import { importValidatedJobsForUser } from "../../services/jobService";
import type { Job } from "../../types/job";

type BackupSectionProps = {
  jobs: Job[];
  userId: string;
  disabled?: boolean;
  onAfterImport: () => void | Promise<void>;
};

export function BackupSection({ jobs, userId, disabled = false, onAfterImport }: BackupSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const handleExport = useCallback(() => {
    setBanner(null);
    if (jobs.length === 0) {
      setBanner({ kind: "err", text: "No jobs to export yet." });
      return;
    }
    try {
      downloadJobsBackup(jobs);
      setBanner({
        kind: "ok",
        text: `Exported ${jobs.length} job${jobs.length === 1 ? "" : "s"} to your Downloads.`
      });
    } catch {
      setBanner({ kind: "err", text: "Export failed. Try again." });
    }
  }, [jobs]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) {
        return;
      }

      setBusy(true);
      setBanner(null);

      try {
        const text = await file.text();
        let parsed: unknown;
        try {
          parsed = JSON.parse(text) as unknown;
        } catch {
          setBanner({ kind: "err", text: "This file is not valid JSON." });
          return;
        }

        const validation = validateBackupPayload(parsed);
        if (!validation.ok) {
          setBanner({ kind: "err", text: validation.error });
          return;
        }

        const { imported, skippedDuplicate } = await importValidatedJobsForUser(
          userId,
          validation.jobs,
          jobs
        );

        const rejected = validation.rejectedRowNumbers.length;
        const parts = [`Imported ${imported} job${imported === 1 ? "" : "s"}.`];
        if (skippedDuplicate > 0) {
          parts.push(`Skipped ${skippedDuplicate} duplicate URL${skippedDuplicate === 1 ? "" : "s"}.`);
        }
        if (rejected > 0) {
          parts.push(`Skipped ${rejected} invalid row${rejected === 1 ? "" : "s"}.`);
        }
        setBanner({ kind: "ok", text: parts.join(" ") });

        await onAfterImport();
      } catch {
        setBanner({ kind: "err", text: "Import failed. Check your connection and try again." });
      } finally {
        setBusy(false);
      }
    },
    [jobs, userId, onAfterImport]
  );

  const isDisabled = disabled || busy;

  return (
    <section className="rounded-xl border border-slate-200/90 bg-white px-2.5 py-2 shadow-sm ring-1 ring-slate-900/[0.03]">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Backup
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={isDisabled}
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Export jobs
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          className="flex-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-medium text-blue-900 shadow-sm hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Importing…" : "Import jobs"}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-hidden
        onChange={handleFileChange}
      />
      {banner ? (
        <p
          className={`mt-2 rounded-lg px-2 py-1 text-[11px] leading-snug ${
            banner.kind === "ok"
              ? "bg-emerald-50 text-emerald-900"
              : "bg-red-50 text-red-800"
          }`}
          role={banner.kind === "err" ? "alert" : "status"}
        >
          {banner.text}
        </p>
      ) : null}
    </section>
  );
}
