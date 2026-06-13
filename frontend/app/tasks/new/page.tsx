import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";
import { TaskForm } from "@/components/task-form";

export const metadata = { title: "New task" };

export default function NewTaskPage() {
  return (
    <AppShell>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 mb-6"
      >
        <CaretLeft size={14} /> Back to tasks
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        New task
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 mb-8">
        Capture the work and keep moving.
      </p>
      <TaskForm />
    </AppShell>
  );
}
