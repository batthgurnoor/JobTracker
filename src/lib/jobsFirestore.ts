import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  type Firestore,
  type Timestamp
} from "firebase/firestore";
import {
  DEFAULT_JOB_STATUS,
  JOB_STATUSES,
  type JobRecord,
  type JobStatus,
  type JobWritePayload
} from "../types/job";

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

export function documentToJobRecord(docId: string, data: DocumentData): JobRecord {
  return {
    id: docId,
    jobTitle: String(data.jobTitle ?? ""),
    company: String(data.company ?? ""),
    location: String(data.location ?? ""),
    url: String(data.url ?? ""),
    status: normalizeStatus(data.status),
    notes: String(data.notes ?? ""),
    dateSaved: String(data.dateSaved ?? ""),
    updatedAtIso: timestampToIso(data.updatedAt)
  };
}

/**
 * Saves a job under users/{userId}/jobs with a new document id.
 */
export async function saveJobForUser(
  db: Firestore,
  userId: string,
  payload: JobWritePayload
): Promise<void> {
  const jobsRef = collection(db, "users", userId, "jobs");
  await addDoc(jobsRef, {
    ...payload,
    updatedAt: serverTimestamp()
  });
}

/**
 * Loads the signed-in user's jobs only (same path), newest first.
 */
export async function loadJobsForUser(db: Firestore, userId: string): Promise<JobRecord[]> {
  const jobsRef = collection(db, "users", userId, "jobs");
  const jobsQuery = query(jobsRef, orderBy("dateSaved", "desc"));
  const snapshot = await getDocs(jobsQuery);
  return snapshot.docs.map((doc) => documentToJobRecord(doc.id, doc.data()));
}
