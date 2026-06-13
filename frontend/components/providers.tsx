"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";

import { API_BASE } from "@/lib/api";
import type { ApiError } from "@/lib/api";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            // Retry on transient network / 5xx failures (Render free-tier cold starts),
            // but not on real client errors so 401 / 404 / 422 surface immediately.
            retry: (failureCount, error) => {
              const err = error as unknown as Partial<ApiError> | undefined;
              if (err && typeof err.status === "number" && err.status < 500) return false;
              return failureCount < 3;
            },
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
          },
        },
      }),
  );

  useEffect(() => {
    // Cold-start nudge: hit the backend health endpoint as soon as the app mounts
    // so the container is awake by the time the user clicks anything.
    fetch(`${API_BASE}/health`, { credentials: "omit", cache: "no-store" }).catch(() => {});
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
