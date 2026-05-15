import { formatFollowUpLabel, getFollowUpUrgency } from "../../lib/followUpDate";

type FollowUpBadgeProps = {
  followUpDate: string;
};

export function FollowUpBadge({ followUpDate }: FollowUpBadgeProps) {
  const urgency = getFollowUpUrgency(followUpDate);
  if (urgency === "none") {
    return null;
  }

  const label =
    urgency === "today"
      ? "Follow-up today"
      : `Overdue · ${formatFollowUpLabel(followUpDate)}`;

  const className =
    urgency === "today"
      ? "bg-amber-100 text-amber-900 ring-amber-200"
      : "bg-red-100 text-red-800 ring-red-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}
