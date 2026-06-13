"use client";

import Link from "next/link";
import { CaretLeft, CaretRight, Plus, ListChecks } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskFilters } from "@/components/task-filters";
import { TaskRow } from "@/components/task-row";
import { useTasks, type TaskListParams } from "@/lib/queries";

const initial: TaskListParams = {
  status: "",
  search: "",
  sort: "created_at",
  order: "desc",
  page: 1,
  page_size: 10,
};

export default function Home() {
  const reduce = useReducedMotion();
  const [params, setParams] = useState<TaskListParams>(initial);
  const { data, isLoading, isError, error, refetch, isFetching } = useTasks(params);

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
            My tasks
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {data
              ? `${data.total} ${data.total === 1 ? "task" : "tasks"} total`
              : "Loading your work..."}
          </p>
        </div>
        <Link href="/tasks/new" aria-label="Create task">
          <Button>
            <Plus size={16} weight="bold" /> New task
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <TaskFilters value={params} onChange={setParams} />
      </div>

      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 divide-y divide-zinc-100 dark:divide-zinc-900 overflow-hidden">
        {isLoading ? (
          <div className="p-2 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-10 text-center"
          >
            <p className="text-sm text-red-600 dark:text-red-400">
              Could not load tasks. {(error as { message?: string })?.message}
            </p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => refetch()}>
              Retry
            </Button>
          </motion.div>
        ) : data && data.items.length === 0 ? (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="px-6 py-16 text-center"
          >
            <ListChecks size={32} className="mx-auto text-zinc-400" aria-hidden />
            <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {params.search || params.status ? "No tasks match these filters" : "No tasks yet"}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {params.search || params.status
                ? "Try clearing filters or change what you are looking for."
                : "Create your first task to get started."}
            </p>
            {!(params.search || params.status) && (
              <Link href="/tasks/new" className="inline-block mt-4">
                <Button size="sm">
                  <Plus size={14} weight="bold" /> New task
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <AnimatePresence initial mode="popLayout">
            {data?.items.map((t, i) => (
              <TaskRow key={t.id} task={t} index={i} />
            ))}
          </AnimatePresence>
        )}
      </section>

      {data && data.total_pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-zinc-500 dark:text-zinc-400 tabular-nums">
            Page {data.page} of {data.total_pages}
            {isFetching && <span className="ml-2 text-zinc-400">updating...</span>}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => setParams({ ...params, page: data.page - 1 })}
              aria-label="Previous page"
            >
              <CaretLeft size={14} /> Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={data.page >= data.total_pages}
              onClick={() => setParams({ ...params, page: data.page + 1 })}
              aria-label="Next page"
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
