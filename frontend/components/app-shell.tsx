"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckSquare, SignOut, User as UserIcon } from "@phosphor-icons/react";
import { useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLogout, useUser } from "@/lib/queries";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading } = useUser();
  const logout = useLogout();

  useEffect(() => {
    if (!isLoading && user === null) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading || user === undefined) {
    return (
      <div className="min-h-[100dvh] grid place-items-center text-sm text-zinc-500">
        Loading...
      </div>
    );
  }
  if (user === null) return null;

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <CheckSquare size={20} weight="duotone" aria-hidden />
            <span className="font-mono text-sm">tasks</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800"
            >
              My tasks
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800"
              >
                Admin
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 px-2">
              <UserIcon size={16} aria-hidden />
              <span className="truncate max-w-[14ch]">{user.email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout.mutate(undefined, { onSuccess: () => router.replace("/login") });
              }}
              aria-label="Sign out"
            >
              <SignOut size={16} aria-hidden /> <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-12">{children}</main>
    </div>
  );
}
