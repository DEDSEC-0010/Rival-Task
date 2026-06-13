"use client";

import { useRouter } from "next/navigation";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminTasks, useUser } from "@/lib/queries";
import type { TaskStatus } from "@/lib/types";

export default function AdminPage() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useAdminTasks({ status, page, page_size: 20 });

  useEffect(() => {
    if (!userLoading && user && user.role !== "admin") router.replace("/");
  }, [user, userLoading, router]);

  if (userLoading || !user || user.role !== "admin") {
    return (
      <AppShell>
        <Skeleton className="h-8 w-48" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            All tasks
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Admin view. Shows tasks across every user.
          </p>
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as TaskStatus | "");
            setPage(1);
          }}
          aria-label="Filter by status"
          className="max-w-[12rem]"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </Select>
      </div>

      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
        {isLoading ? (
          <div className="p-2 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="p-6 text-sm text-red-600 dark:text-red-400">
            {(error as { message?: string })?.message ?? "Could not load tasks"}
          </p>
        ) : data && data.items.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No tasks match.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">Title</th>
                <th className="text-left font-medium px-4 py-2.5 hidden md:table-cell">Owner ID</th>
                <th className="text-left font-medium px-4 py-2.5">Status</th>
                <th className="text-left font-medium px-4 py-2.5 hidden sm:table-cell">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {data?.items.map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={reduce ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: reduce ? 0 : Math.min(i * 0.02, 0.2),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50 max-w-[28ch] truncate">
                    {t.title}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400 hidden md:table-cell">
                    {t.user_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <PriorityBadge priority={t.priority} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {data && data.total_pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-zinc-500 dark:text-zinc-400 tabular-nums">
            Page {data.page} of {data.total_pages}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>
              <CaretLeft size={14} /> Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={data.page >= data.total_pages}
              onClick={() => setPage(data.page + 1)}
            >
              Next <CaretRight size={14} />
            </Button>
          </div>
        </div>
      )}
      </motion.div>
    </AppShell>
  );
}
