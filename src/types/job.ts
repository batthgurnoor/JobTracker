export const DEFAULT_JOB_STATUS = "Saved" as const;

export const JOB_STATUSES = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected"
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

/** Job as shown in the UI after reading from Firestore. */
export type JobRecord = {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  url: string;
  status: JobStatus;
  notes: string;
  dateSaved: string;
  updatedAtIso: string;
};

/** Fields written when the user saves a job (path: users/{userId}/jobs/{jobId}). */
export type JobWritePayload = {
  jobTitle: string;
  company: string;
  location: string;
  url: string;
  status: JobStatus;
  notes: string;
  dateSaved: string;
};
