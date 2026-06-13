import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="One email, one password, and you're in. Eight characters minimum."
      footer={
        <span>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-900 dark:text-zinc-100 underline-offset-2 hover:underline">
            Sign in
          </Link>
        </span>
      }
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
