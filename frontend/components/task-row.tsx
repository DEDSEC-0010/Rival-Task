"use client";

import Link from "next/link";
import { Check, Circle, Trash, CalendarBlank } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { useDeleteTask, useToggleComplete } from "@/lib/queries";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatDue(d: string | null): string | null {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function TaskRow({ task, index = 0 }: { task: Task; index?: number }) {
  const reduce = useReducedMotion();
  const toggle = useToggleComplete();
  const del = useDeleteTask();
  const done = task.status === "completed";
  const due = formatDue(task.due_date);
  const overdue = !done && task.due_date && new Date(task.due_date) < new Date();

  return (
    <motion.div
      layout
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: -16, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{
        duration: 0.24,
        delay: reduce ? 0 : Math.min(index * 0.025, 0.25),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors overflow-hidden"
    >
      <motion.button
        type="button"
        aria-label={done ? "Mark as pending" : "Mark as completed"}
        whileTap={reduce ? undefined : { scale: 0.88 }}
        onClick={() =>
          toggle.mutate({ id: task.id, status: done ? "pending" : "completed" })
        }
        className={cn(
          "shrink-0 h-5 w-5 rounded-full border flex items-center justify-center transition-colors",
          done
            ? "bg-emerald-600 border-emerald-600 text-white"
            : "border-zinc-300 dark:border-zinc-700 text-transparent hover:border-emerald-500 hover:text-emerald-500",
        )}
      >
        {done ? <Check size={12} weight="bold" /> : <Circle size={12} />}
      </motion.button>

      <Link href={`/tasks/${task.id}/edit`} className="min-w-0 flex-1 group/link">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
          <motion.p
            layout="position"
            className={cn(
              "text-sm font-medium truncate transition-colors",
              done
                ? "line-through text-zinc-400 dark:text-zinc-500"
                : "text-zinc-900 dark:text-zinc-50 group-hover/link:underline underline-offset-2",
            )}
          >
            {task.title}
          </motion.p>
          {task.description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{task.description}</p>
          )}
        </div>
      </Link>

      <div className="hidden md:flex items-center gap-3 text-xs">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
        {due && (
          <span
            className={cn(
              "inline-flex items-center gap-1 tabular-nums",
              overdue ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400",
            )}
          >
            <CalendarBlank size={12} aria-hidden /> {due}
          </span>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        aria-label="Delete task"
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 px-2"
        onClick={() => {
          if (confirm(`Delete "${task.title}"?`)) del.mutate(task.id);
        }}
      >
        <Trash size={16} aria-hidden />
      </Button>
    </motion.div>
  );
}
