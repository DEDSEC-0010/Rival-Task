"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  PlusCircle,
  PencilSimple,
  Check,
  ArrowCounterClockwise,
  type Icon,
} from "@phosphor-icons/react";

import { Skeleton } from "@/components/ui/skeleton";
import { useTaskActivity } from "@/lib/queries";
import type { TaskAction, TaskActivity } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACTION_META: Record<TaskAction, { icon: Icon; label: string; tint: string }> = {
  created: {
    icon: PlusCircle,
    label: "created the task",
    tint: "text-zinc-500 dark:text-zinc-400",
  },
  updated: {
    icon: PencilSimple,
    label: "updated",
    tint: "text-blue-600 dark:text-blue-400",
  },
  completed: {
    icon: Check,
    label: "marked complete",
    tint: "text-emerald-600 dark:text-emerald-400",
  },
  reopened: {
    icon: ArrowCounterClockwise,
    label: "reopened",
    tint: "text-amber-600 dark:text-amber-400",
  },
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function truncate(value: unknown, max = 40): string {
  const s = value === null || value === undefined ? "—" : String(value);
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function DiffLine({ field, change }: { field: string; change: { from: unknown; to: unknown } }) {
  return (
    <div className="text-xs flex items-baseline gap-2 text-zinc-600 dark:text-zinc-400">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">{field}</span>
      <span className="line-through text-zinc-400 dark:text-zinc-500 truncate max-w-[18ch]">
        {truncate(change.from)}
      </span>
      <span aria-hidden className="text-zinc-300 dark:text-zinc-600">→</span>
      <span className="text-zinc-900 dark:text-zinc-100 truncate max-w-[22ch]">
        {truncate(change.to)}
      </span>
    </div>
  );
}

function ActivityRow({ entry, index }: { entry: TaskActivity; index: number }) {
  const reduce = useReducedMotion();
  const meta = ACTION_META[entry.action];
  const Icon = meta.icon;
  const changed = (entry.details as { changed?: Record<string, { from: unknown; to: unknown }> } | null)?.changed;

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.22,
        delay: reduce ? 0 : Math.min(index * 0.04, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative pl-8 pb-5 last:pb-0"
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-0.5 grid place-items-center h-6 w-6 rounded-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800",
          meta.tint,
        )}
      >
        <Icon size={12} weight="bold" />
      </span>
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          You <span className="font-medium text-zinc-900 dark:text-zinc-50">{meta.label}</span>
        </p>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
          {formatWhen(entry.created_at)}
        </span>
      </div>
      {changed && Object.keys(changed).length > 0 && (
        <div className="mt-1.5 space-y-0.5">
          {Object.entries(changed).map(([field, change]) => (
            <DiffLine key={field} field={field} change={change} />
          ))}
        </div>
      )}
    </motion.li>
  );
}

export function TaskActivityTimeline({ taskId }: { taskId: string }) {
  const { data, isLoading, isError } = useTaskActivity(taskId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }
  if (isError) {
    return <p className="text-sm text-red-600 dark:text-red-400">Could not load activity.</p>;
  }
  if (!data || data.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No activity yet.</p>;
  }
  return (
    <ol className="relative">
      <span
        aria-hidden
        className="absolute left-3 top-2 bottom-2 w-px bg-zinc-200 dark:bg-zinc-800"
      />
      {data.map((entry, i) => (
        <ActivityRow key={entry.id} entry={entry} index={i} />
      ))}
    </ol>
  );
}
