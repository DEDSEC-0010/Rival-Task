import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api, type ApiError } from "./api";
import type {
  AuthResponse,
  Page,
  Task,
  TaskActivity,
  TaskPriority,
  TaskStatus,
  User,
} from "./types";

export const userKey = ["auth", "me"] as const;

export function useUser() {
  return useQuery<User | null>({
    queryKey: userKey,
    queryFn: async () => {
      try {
        return await api.get<User>("/auth/me");
      } catch (e) {
        const err = e as ApiError;
        if (err.status === 401) return null;
        throw e;
      }
    },
    staleTime: 30_000,
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api.post<AuthResponse>("/auth/login", body),
    onSuccess: (data) => qc.setQueryData(userKey, data.user),
  });
}

export function useSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api.post<AuthResponse>("/auth/signup", body),
    onSuccess: (data) => qc.setQueryData(userKey, data.user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>("/auth/logout"),
    onSuccess: () => {
      qc.setQueryData(userKey, null);
      qc.removeQueries({ queryKey: ["tasks"] });
    },
  });
}

export type TaskListParams = {
  status?: TaskStatus | "";
  search?: string;
  sort?: "due_date" | "priority" | "created_at";
  order?: "asc" | "desc";
  page?: number;
  page_size?: number;
};

function buildQuery(params: TaskListParams): string {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  if (params.sort) qs.set("sort", params.sort);
  if (params.order) qs.set("order", params.order);
  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function useTasks(params: TaskListParams) {
  return useQuery<Page<Task>>({
    queryKey: ["tasks", params],
    queryFn: () => api.get<Page<Task>>(`/tasks${buildQuery(params)}`),
    placeholderData: keepPreviousData,
  });
}

export function useTask(id: string | null) {
  return useQuery<Task>({
    queryKey: ["task", id],
    queryFn: () => api.get<Task>(`/tasks/${id}`),
    enabled: !!id,
  });
}

export function useTaskActivity(id: string | null) {
  return useQuery<TaskActivity[]>({
    queryKey: ["task-activity", id],
    queryFn: () => api.get<TaskActivity[]>(`/tasks/${id}/activity`),
    enabled: !!id,
  });
}

export type TaskInput = {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
};

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TaskInput) => api.post<Task>("/tasks", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<TaskInput>) => api.patch<Task>(`/tasks/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task", id] });
      qc.invalidateQueries({ queryKey: ["task-activity", id] });
    },
  });
}

// Optimistic toggle for "completed" status — used from the list view
export function useToggleComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      api.patch<Task>(`/tasks/${id}`, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const previous = qc.getQueriesData<Page<Task>>({ queryKey: ["tasks"] });
      previous.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData(key, {
          ...data,
          items: data.items.map((t) => (t.id === id ? { ...t, status } : t)),
        });
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      ctx?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<void>(`/tasks/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const previous = qc.getQueriesData<Page<Task>>({ queryKey: ["tasks"] });
      previous.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData(key, {
          ...data,
          items: data.items.filter((t) => t.id !== id),
          total: Math.max(0, data.total - 1),
        });
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      ctx?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useAdminTasks(params: { status?: TaskStatus | ""; page?: number; page_size?: number }) {
  return useQuery<Page<Task>>({
    queryKey: ["admin-tasks", params],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params.status) qs.set("status", params.status);
      if (params.page) qs.set("page", String(params.page));
      if (params.page_size) qs.set("page_size", String(params.page_size));
      const s = qs.toString();
      return api.get<Page<Task>>(`/admin/tasks${s ? `?${s}` : ""}`);
    },
    placeholderData: keepPreviousData,
  });
}
