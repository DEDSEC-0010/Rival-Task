"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";

import { Input, Select } from "@/components/ui/input";
import type { TaskListParams } from "@/lib/queries";

type Props = {
  value: TaskListParams;
  onChange: (next: TaskListParams) => void;
};

export function TaskFilters({ value, onChange }: Props) {
  function set<K extends keyof TaskListParams>(key: K, v: TaskListParams[K]) {
    onChange({ ...value, [key]: v, page: 1 });
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-3">
      <div className="relative">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search by title"
          value={value.search ?? ""}
          onChange={(e) => set("search", e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        value={value.status ?? ""}
        onChange={(e) => set("status", e.target.value as TaskListParams["status"])}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In progress</option>
        <option value="completed">Completed</option>
      </Select>
      <Select
        value={value.sort ?? "created_at"}
        onChange={(e) => set("sort", e.target.value as TaskListParams["sort"])}
        aria-label="Sort by"
      >
        <option value="created_at">Sort: created</option>
        <option value="due_date">Sort: due date</option>
        <option value="priority">Sort: priority</option>
      </Select>
      <Select
        value={value.order ?? "desc"}
        onChange={(e) => set("order", e.target.value as TaskListParams["order"])}
        aria-label="Order"
      >
        <option value="desc">Newest first</option>
        <option value="asc">Oldest first</option>
      </Select>
    </div>
  );
}
