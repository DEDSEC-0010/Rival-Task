export type UserRole = "user" | "admin";

export type User = {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
};

export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type AuthResponse = {
  user: User;
  token: string;
};

export type TaskAction = "created" | "updated" | "completed" | "reopened";

export type TaskActivity = {
  id: string;
  task_id: string;
  user_id: string;
  action: TaskAction;
  details: Record<string, unknown> | null;
  created_at: string;
};
