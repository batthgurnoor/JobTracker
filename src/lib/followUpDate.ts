export type FollowUpUrgency = "none" | "today" | "overdue";

export function toDateInputValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString().slice(0, 10);
}

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function getFollowUpUrgency(followUpDate: string): FollowUpUrgency {
  const normalized = toDateInputValue(followUpDate);
  if (!normalized) {
    return "none";
  }

  const target = startOfLocalDay(new Date(`${normalized}T12:00:00`));
  const today = startOfLocalDay(new Date());

  if (Number.isNaN(target)) {
    return "none";
  }
  if (target < today) {
    return "overdue";
  }
  if (target === today) {
    return "today";
  }
  return "none";
}

export function formatFollowUpLabel(followUpDate: string): string {
  const normalized = toDateInputValue(followUpDate);
  if (!normalized) {
    return "";
  }
  const parsed = new Date(`${normalized}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
