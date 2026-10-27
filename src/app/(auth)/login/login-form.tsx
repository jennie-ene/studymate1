"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput } from "@/components/ui/field";
import { Alert } from "@/components/ui/feedback";
import { supabaseBrowser } from "@/lib/supabase/client";
import { validateEmail } from "@/lib/validation";
import { friendlyError } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(
    params.get("error") === "link" ? "That link is invalid or has expired. Please try again." : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const errs = { email: validateEmail(email), password: password ? null : "Enter your password." };
    setErrors(errs);
    if (errs.email || errs.password) return;

    setLoading(true);
    try {
      const { error } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      router.replace(safeNext);
      router.refresh();
    } catch (err) {
      setServerError(friendlyError(err));
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
      <p className="mt-1.5 text-sm text-slate-600">Log in to pick up where you left off.</p>

      {params.get("reset") === "1" && (
        <Alert variant="success" className="mt-6">
          Your password has been updated. Log in with your new password.
        </Alert>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        {serverError && <Alert variant="error">{serverError}</Alert>}
        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <div className="space-y-2">
          <PasswordInput
            label="Password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            required
          />
          <div className="text-right">
            <Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        New to StudyMate?{" "}
        <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </>
  );
}
