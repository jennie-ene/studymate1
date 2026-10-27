"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/feedback";
import { supabaseBrowser } from "@/lib/supabase/client";
import { validateEmail } from "@/lib/validation";
import { friendlyError } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setServerError(null);
    const err = validateEmail(email);
    setFieldError(err);
    if (err) return;
    setLoading(true);
    try {
      const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (e) {
      setServerError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <MailCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Check your inbox</h1>
        <p className="mt-2 text-sm text-slate-600" role="status">
          If an account exists for <span className="font-medium text-slate-900">{email}</span>, we&apos;ve sent a link to
          reset your password. It may take a minute to arrive — check your spam folder too.
        </p>
        {serverError && <Alert variant="error" className="mt-4 text-left">{serverError}</Alert>}
        <div className="mt-6 flex flex-col gap-2">
          <Button variant="outline" onClick={() => send()} loading={loading}>
            Resend link
          </Button>
          <Link href="/login" className="py-2 text-sm font-medium text-brand-600 hover:text-brand-700">
            Back to log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to log in
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Forgot your password?</h1>
      <p className="mt-1.5 text-sm text-slate-600">
        Enter the email you signed up with and we&apos;ll send you a link to reset it.
      </p>
      <form onSubmit={send} noValidate className="mt-8 space-y-5">
        {serverError && <Alert variant="error">{serverError}</Alert>}
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError}
          required
        />
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </>
  );
}
