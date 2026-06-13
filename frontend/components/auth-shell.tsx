import type { ReactNode } from "react";
import { CheckSquare } from "@phosphor-icons/react/dist/ssr";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="min-h-[100dvh] grid lg:grid-cols-5">
      <section className="lg:col-span-2 flex items-center justify-center px-6 py-16 lg:py-24">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10 text-zinc-900 dark:text-zinc-50">
            <CheckSquare size={22} weight="duotone" aria-hidden />
            <span className="font-mono text-sm tracking-tight">tasks</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-[42ch] leading-relaxed">
            {subtitle}
          </p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">{footer}</div>
        </div>
      </section>
      <aside className="hidden lg:flex lg:col-span-3 relative bg-zinc-900 dark:bg-zinc-950 text-zinc-100 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div />
          <div className="max-w-md">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-4">
              A focused workspace
            </p>
            <p className="text-2xl font-medium leading-snug text-zinc-50">
              The list is short on purpose. Capture the work, set the priority, ship it.
            </p>
            <p className="mt-6 text-sm text-zinc-400 max-w-prose leading-relaxed">
              Filter by status, search by title, sort by what is due first. Your tasks belong to you, and only you.
            </p>
          </div>
          <div className="font-mono text-xs text-zinc-500">tasks v1.0</div>
        </div>
      </aside>
    </main>
  );
}
