"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/field";
import { Alert } from "@/components/ui/feedback";
import { supabaseBrowser } from "@/lib/supabase/client";
import { validatePassword } from "@/lib/validation";
import { friendlyError } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string | null; confirm?: string | null }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const errs = {
      password: validatePassword(password),
      confirm: confirm !== password ? "Passwords don't match." : null,
    };
    setErrors(errs);
    if (errs.password || errs.confirm) return;
    setLoading(true);
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
      await sb.auth.signOut();
      router.replace("/login?reset=1");
    } catch (err) {
      const msg = friendlyError(err);
      setServerError(
        /session/i.test(msg) ? "Your reset link has expired. Request a new one from the Forgot password page." : msg,
      );
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Set a new password</h1>
      <p className="mt-1.5 text-sm text-slate-600">Choose a strong password you haven&apos;t used before.</p>
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        {serverError && (
          <Alert variant="error">
            {serverError}{" "}
            <Link href="/forgot-password" className="font-medium underline">
              Request a new link
            </Link>
          </Alert>
        )}
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Update password
        </Button>
      </form>
    </>
  );
}
