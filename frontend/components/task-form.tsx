"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateTask, useUpdateTask } from "@/lib/queries";
import type { Task } from "@/lib/types";
import type { ApiError } from "@/lib/api";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Max 200 characters"),
  description: z.string().max(10000).optional().or(z.literal("")),
  status: z.enum(["pending", "in_progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  due_date: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function TaskForm({ task }: { task?: Task }) {
  const router = useRouter();
  const create = useCreateTask();
  const update = useUpdateTask(task?.id ?? "");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "pending",
      priority: task?.priority ?? "medium",
      due_date: toDateInputValue(task?.due_date),
    },
  });

  const mutation = task ? update : create;
  const err = mutation.error as ApiError | null;

  async function onSubmit(values: FormValues) {
    const payload = {
      title: values.title,
      description: values.description || null,
      status: values.status,
      priority: values.priority,
      due_date: values.due_date ? new Date(values.due_date).toISOString() : null,
    };
    try {
      await mutation.mutateAsync(payload);
      router.push("/");
    } catch {
      /* shown below */
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 max-w-2xl">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" aria-invalid={!!errors.title} {...register("title")} />
        {errors.title && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="What does done look like?"
          {...register("description")}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...register("status")}>
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select id="priority" {...register("priority")}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="due_date">Due date</Label>
          <Input id="due_date" type="date" {...register("due_date")} />
        </div>
      </div>

      {err && (
        <div
          role="alert"
          className="text-sm rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {err.message ?? "Could not save task"}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          {mutation.isPending ? "Saving..." : task ? "Save changes" : "Create task"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
