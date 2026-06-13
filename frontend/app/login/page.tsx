import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Pick up where you left off."
      footer={
        <span>
          New here?{" "}
          <Link href="/signup" className="font-medium text-zinc-900 dark:text-zinc-100 underline-offset-2 hover:underline">
            Create an account
          </Link>
        </span>
      }
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
