"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput } from "@/components/ui/field";
import { Alert } from "@/components/ui/feedback";
import { supabaseBrowser } from "@/lib/supabase/client";
import { passwordRules, validateEmail, validatePassword, validateRequired } from "@/lib/validation";
import { cn, friendlyError } from "@/lib/utils";

type Errors = Partial<Record<"fullName" | "email" | "password", string | null>>;

export function SignUpForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const validate = (): Errors => ({
    fullName: validateRequired(fullName, "Full name", 80),
    email: validateEmail(email),
    password: validatePassword(password),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    const errs = validate();
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    try {
      const sb = supabaseBrowser();
      const { data, error } = await sb.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) throw error;
      // Supabase returns a fake user with no identities when the email is already taken.
      if (data.user && data.user.identities?.length === 0) {
        throw new Error("User already registered");
      }
      if (data.session) {
        router.replace("/dashboard?welcome=1");
        router.refresh();
      } else {
        setCheckEmail(true);
      }
    } catch (err) {
      setServerError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Mail className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Check your email</h1>
        <p className="mt-2 text-sm text-slate-600" role="status">
          We sent a confirmation link to <span className="font-medium text-slate-900">{email}</span>. Click it to
          activate your account and you&apos;ll go straight to your dashboard.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
          Back to log in
        </Link>
      </div>
    );
  }

  const live = submitted ? validate() : errors;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create your account</h1>
      <p className="mt-1.5 text-sm text-slate-600">Start planning your studies in under two minutes.</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        {serverError && <Alert variant="error">{serverError}</Alert>}
        <Input
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Amara Okafor"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={live.fullName}
          required
        />
        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={live.email}
          required
        />
        <div>
          <PasswordInput
            label="Password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={submitted ? live.password : null}
            required
          />
          <ul className="mt-2.5 grid gap-1 text-xs" aria-label="Password requirements">
            {passwordRules.map((r) => {
              const ok = r.test(password);
              return (
                <li key={r.id} className={cn("flex items-center gap-1.5", ok ? "text-emerald-600" : "text-slate-500")}>
                  {ok ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />}
                  {r.label}
                  <span className="sr-only">{ok ? "(met)" : "(not met)"}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Log in
        </Link>
      </p>
    </>
  );
}
