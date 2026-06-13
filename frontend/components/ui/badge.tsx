import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus } from "@/lib/types";

const statusStyles: Record<TaskStatus, string> = {
  pending:
    "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  in_progress:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
  completed:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
};

const priorityStyles: Record<TaskPriority, string> = {
  low: "text-zinc-500 dark:text-zinc-400",
  medium: "text-amber-600 dark:text-amber-400",
  high: "text-red-600 dark:text-red-400",
};

const statusLabel: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        statusStyles[status],
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", priorityStyles[priority])}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden />
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}
