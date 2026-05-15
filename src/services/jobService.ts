import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type Timestamp
} from "firebase/firestore";
import { getFirestoreInstance } from "../lib/firebase";
import {
  DEFAULT_JOB_STATUS,
  JOB_STATUSES,
  type Job,
  type JobCreateInput,
  type JobStatus,
  type JobUpdateInput
} from "../types/job";
import { toDateInputValue } from "../lib/followUpDate";

export class DuplicateJobUrlError extends Error {
  constructor() {
    super("This job URL is already in your list.");
    this.name = "DuplicateJobUrlError";
  }
}

function jobsCollection(userId: string) {
  return collection(getFirestoreInstance(), "users", userId, "jobs");
}

function timestampToIso(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    const date = (value as Timestamp).toDate();
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return "";
}

function normalizeStatus(value: unknown): JobStatus {
  if (typeof value === "string" && (JOB_STATUSES as readonly string[]).includes(value)) {
    return value as JobStatus;
  }
  return DEFAULT_JOB_STATUS;
}

export function normalizeJobUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    let path = parsed.pathname;
    if (path.length > 1 && path.endsWith("/")) {
      path = path.slice(0, -1);
    }
    parsed.pathname = path;
    return parsed.href.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function documentToJob(docId: string, data: DocumentData): Job {
  return {
    id: docId,
    jobTitle: String(data.jobTitle ?? ""),
    company: String(data.company ?? ""),
    location: String(data.location ?? ""),
    url: String(data.url ?? ""),
    salary: String(data.salary ?? ""),
    status: normalizeStatus(data.status),
    notes: String(data.notes ?? ""),
    followUpDate: toDateInputValue(String(data.followUpDate ?? "")),
    dateSaved: String(data.dateSaved ?? ""),
    updatedAt: timestampToIso(data.updatedAt)
  };
}

export async function fetchJobsForUser(userId: string): Promise<Job[]> {
  const jobsRef = jobsCollection(userId);
  const jobsQuery = query(jobsRef, orderBy("dateSaved", "desc"));
  const snapshot = await getDocs(jobsQuery);
  return snapshot.docs.map((jobDoc) => documentToJob(jobDoc.id, jobDoc.data()));
}

export async function hasJobWithUrl(userId: string, url: string): Promise<boolean> {
  const normalized = normalizeJobUrl(url);
  const snapshot = await getDocs(jobsCollection(userId));
  return snapshot.docs.some(
    (jobDoc) => normalizeJobUrl(String(jobDoc.data().url ?? "")) === normalized
  );
}

export async function createJobForUser(userId: string, input: JobCreateInput): Promise<void> {
  const url = input.url.trim();
  if (await hasJobWithUrl(userId, url)) {
    throw new DuplicateJobUrlError();
  }

  const jobsRef = jobsCollection(userId);
  await addDoc(jobsRef, {
    ...input,
    url,
    salary: input.salary?.trim() ?? "",
    followUpDate: toDateInputValue(input.followUpDate ?? ""),
    updatedAt: serverTimestamp()
  });
}

export async function updateJobForUser(
  userId: string,
  jobId: string,
  input: JobUpdateInput
): Promise<void> {
  const jobRef = doc(getFirestoreInstance(), "users", userId, "jobs", jobId);
  await updateDoc(jobRef, {
    jobTitle: input.jobTitle.trim(),
    company: input.company.trim(),
    location: input.location.trim(),
    salary: input.salary.trim(),
    status: input.status,
    notes: input.notes.trim(),
    followUpDate: toDateInputValue(input.followUpDate),
    updatedAt: serverTimestamp()
  });
}

export async function updateJobStatusForUser(
  userId: string,
  jobId: string,
  status: JobStatus
): Promise<void> {
  const jobRef = doc(getFirestoreInstance(), "users", userId, "jobs", jobId);
  await updateDoc(jobRef, {
    status,
    updatedAt: serverTimestamp()
  });
}

export async function deleteJobForUser(userId: string, jobId: string): Promise<void> {
  const jobRef = doc(getFirestoreInstance(), "users", userId, "jobs", jobId);
  await deleteDoc(jobRef);
}

export async function importValidatedJobsForUser(
  userId: string,
  payloads: JobCreateInput[],
  existingJobs: Job[]
): Promise<{ imported: number; skippedDuplicate: number }> {
  const seen = new Set(existingJobs.map((j) => normalizeJobUrl(j.url)));
  let imported = 0;
  let skippedDuplicate = 0;

  for (const payload of payloads) {
    const key = normalizeJobUrl(payload.url);
    if (seen.has(key)) {
      skippedDuplicate++;
      continue;
    }
    seen.add(key);
    await createJobForUser(userId, payload);
    imported++;
  }

  return { imported, skippedDuplicate };
}
