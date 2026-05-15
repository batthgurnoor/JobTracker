export const DEFAULT_JOB_STATUS = "Saved" as const;

export const JOB_STATUSES = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected"
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

/** Job document from Firestore: users/{userId}/jobs/{jobId} */
export interface Job {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  url: string;
  status: JobStatus;
  notes: string;
  dateSaved: string;
  updatedAt: string;
}

/** Fields written when creating a new job. */
export interface JobCreateInput {
  jobTitle: string;
  company: string;
  location: string;
  url: string;
  status: JobStatus;
  notes: string;
  dateSaved: string;
}
