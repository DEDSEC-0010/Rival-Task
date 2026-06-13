"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react";

import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskForm } from "@/components/task-form";
import { useTask } from "@/lib/queries";

export default function EditTaskPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? null;
  const { data, isLoading, isError, error } = useTask(id);

  return (
    <AppShell>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 mb-6"
      >
        <CaretLeft size={14} /> Back to tasks
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Edit task
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 mb-8">
        Refine the details, change the status, or push the due date.
      </p>
      {isLoading ? (
        <div className="space-y-4 max-w-2xl">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>
      ) : isError ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          {(error as { message?: string })?.message ?? "Could not load task"}
        </p>
      ) : data ? (
        <TaskForm task={data} />
      ) : null}
    </AppShell>
  );
}
