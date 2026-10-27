"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { Input, PasswordInput, Select } from "@/components/ui/field";
import { Alert } from "@/components/ui/feedback";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/app/user-context";
import { useLogout } from "@/components/app/app-shell";
import { updateProfile } from "@/lib/db";
import { supabaseBrowser } from "@/lib/supabase/client";
import { friendlyError, initials } from "@/lib/utils";
import { validatePassword, validateRequired } from "@/lib/validation";

const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Postgraduate"];

export default function SettingsPage() {
  const { profile, setProfile } = useUser();
  const { toast } = useToast();
  const { logout, loading: loggingOut } = useLogout();

  const [form, setForm] = useState({
    full_name: profile.full_name,
    university: profile.university ?? "",
    programme: profile.programme ?? "",
    year_of_study: profile.year_of_study ?? "",
  });
  const [nameError, setNameError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwErrors, setPwErrors] = useState<{ password?: string | null; confirm?: string | null }>({});
  const [pwError, setPwError] = useState<string | null>(null);
  const [savingPw, setSavingPw] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const dirty =
    form.full_name !== profile.full_name ||
    form.university !== (profile.university ?? "") ||
    form.programme !== (profile.programme ?? "") ||
    form.year_of_study !== (profile.year_of_study ?? "");

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    const err = validateRequired(form.full_name, "Full name", 80);
    setNameError(err);
    if (err) return;
    setSavingProfile(true);
    try {
      const updated = await updateProfile(profile.id, {
        full_name: form.full_name.trim(),
        university: form.university.trim() || null,
        programme: form.programme.trim() || null,
        year_of_study: form.year_of_study || null,
      });
      setProfile(updated);
      toast("Profile updated.");
    } catch (e) {
      setProfileError(friendlyError(e, "We couldn't save your profile."));
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    const errs = {
      password: validatePassword(password),
      confirm: confirm !== password ? "Passwords don't match." : null,
    };
    setPwErrors(errs);
    if (errs.password || errs.confirm) return;
    setSavingPw(true);
    try {
      const { error } = await supabaseBrowser().auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirm("");
      toast("Password changed.");
    } catch (e) {
      setPwError(friendlyError(e, "We couldn't change your password."));
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <>
      <PageHeader title="Profile & Settings" description="Manage your account and personal details." />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Account summary */}
        <Card className="h-fit p-6 text-center lg:order-last">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-semibold text-brand-700" aria-hidden="true">
            {initials(profile.full_name)}
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">{profile.full_name || "Student"}</h2>
          <p className="text-sm text-slate-500">{profile.email}</p>
          {(profile.programme || profile.university) && (
            <p className="mt-2 text-sm text-slate-600">
              {[profile.programme, profile.year_of_study, profile.university].filter(Boolean).join(" · ")}
            </p>
          )}
          <p className="mt-4 text-xs text-slate-400">
            Member since {new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
          <Button variant="outline" className="mt-6 w-full" onClick={() => setConfirmLogout(true)}>
            <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
          </Button>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {/* Profile form */}
          <Card>
            <CardHeader title="Personal information" description="This is how StudyMate greets you." />
            <form onSubmit={saveProfile} noValidate className="space-y-5 p-5">
              {profileError && <Alert variant="error">{profileError}</Alert>}
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Full name"
                  autoComplete="name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  error={nameError}
                  required
                />
                <Input label="Email address" type="email" value={profile.email ?? ""} disabled hint="Your sign-in email can't be changed here." />
                <Input
                  label="University"
                  optional
                  placeholder="e.g. University of Lagos"
                  value={form.university}
                  onChange={(e) => setForm({ ...form, university: e.target.value })}
                />
                <Input
                  label="Programme / course of study"
                  optional
                  placeholder="e.g. BSc Computer Science"
                  value={form.programme}
                  onChange={(e) => setForm({ ...form, programme: e.target.value })}
                />
                <Select
                  label="Year of study"
                  optional
                  value={form.year_of_study}
                  onChange={(e) => setForm({ ...form, year_of_study: e.target.value })}
                >
                  <option value="">Select year</option>
                  {YEARS.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </Select>
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={savingProfile} disabled={!dirty}>
                  Save changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader title="Change password" description="Use at least 8 characters with a letter and a number." />
            <form onSubmit={changePassword} noValidate className="space-y-5 p-5">
              {pwError && <Alert variant="error">{pwError}</Alert>}
              <div className="grid gap-5 sm:grid-cols-2">
                <PasswordInput
                  label="New password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={pwErrors.password}
                />
                <PasswordInput
                  label="Confirm new password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  error={pwErrors.confirm}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="outline" loading={savingPw} disabled={!password}>
                  Update password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={logout}
        loading={loggingOut}
        title="Log out of StudyMate?"
        description="You'll need to sign in again to see your study plan and notes. Your data stays safely saved."
        confirmLabel="Log out"
      />
    </>
  );
}
