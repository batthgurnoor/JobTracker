export const DEFAULT_JOB_STATUS = "Saved" as const;

export const JOB_STATUSES = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected"
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export interface Job {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  url: string;
  salary: string;
  status: JobStatus;
  notes: string;
  followUpDate: string;
  dateSaved: string;
  updatedAt: string;
}

export interface JobCreateInput {
  jobTitle: string;
  company: string;
  location: string;
  url: string;
  salary?: string;
  status: JobStatus;
  notes: string;
  followUpDate?: string;
  dateSaved: string;
}

export interface JobUpdateInput {
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  status: JobStatus;
  notes: string;
  followUpDate: string;
}
