import { JOB_STATUSES, type Job, type JobStatus } from "../types/job";
import { getFollowUpUrgency } from "./followUpDate";

export type DashboardStats = {
  total: number;
  statusCounts: Record<JobStatus, number>;
  followUpToday: number;
  followUpOverdue: number;
};

/** Builds dashboard counts from the current job list (runs client-side only). */
export function computeDashboardStats(jobs: Job[]): DashboardStats {
  const statusCounts = Object.fromEntries(
    JOB_STATUSES.map((status) => [status, 0])
  ) as Record<JobStatus, number>;

  let followUpToday = 0;
  let followUpOverdue = 0;

  for (const job of jobs) {
    statusCounts[job.status]++;
    const urgency = getFollowUpUrgency(job.followUpDate);
    if (urgency === "today") {
      followUpToday++;
    }
    if (urgency === "overdue") {
      followUpOverdue++;
    }
  }

  return {
    total: jobs.length,
    statusCounts,
    followUpToday,
    followUpOverdue
  };
}
