"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Segmented, Select, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { createSession, updateSession, type Priority, type SessionStatus, type StudySession, type SubjectRef } from "@/lib/db";
import { fromInputs, toDateInput, toTimeInput } from "@/lib/date";
import { friendlyError } from "@/lib/utils";
import { validateRequired } from "@/lib/validation";

const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240];

function defaults(session?: StudySession | null, date?: Date) {
  if (session) {
    const d = new Date(session.scheduled_at);
    return {
      title: session.title,
      subject_id: session.subject_id ?? "",
      date: toDateInput(d),
      time: toTimeInput(d),
      duration: String(session.duration_minutes),
      priority: session.priority,
      status: session.status,
      description: session.description ?? "",
    };
  }
  // Default to the next full hour.
  const d = date ? new Date(date) : new Date();
  if (!date) d.setHours(d.getHours() + 1, 0, 0, 0);
  else d.setHours(17, 0, 0, 0);
  return {
    title: "",
    subject_id: "",
    date: toDateInput(d),
    time: toTimeInput(d),
    duration: "60",
    priority: "medium" as Priority,
    status: "pending" as SessionStatus,
    description: "",
  };
}

type Errors = Partial<Record<"title" | "date" | "time" | "duration", string | null>>;

export function SessionForm({
  open,
  onClose,
  session,
  subjects,
  onSaved,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  session?: StudySession | null;
  subjects: SubjectRef[];
  onSaved: (s: StudySession, isNew: boolean) => void;
  defaultDate?: Date;
}) {
  const { toast } = useToast();
  const [values, setValues] = useState(() => defaults(session, defaultDate));
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(defaults(session, defaultDate));
      setErrors({});
      setServerError(null);
    }
  }, [open, session, defaultDate]);

  const set = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) => setValues((s) => ({ ...s, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const duration = Number(values.duration);
    const errs: Errors = {
      title: validateRequired(values.title, "Session title", 120),
      date: values.date ? null : "Choose a date.",
      time: values.time ? null : "Choose a start time.",
      duration: duration >= 5 && duration <= 600 ? null : "Duration must be between 5 and 600 minutes.",
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    const input = {
      title: values.title.trim(),
      subject_id: values.subject_id || null,
      scheduled_at: fromInputs(values.date, values.time).toISOString(),
      duration_minutes: duration,
      priority: values.priority,
      status: values.status,
      description: values.description.trim() || null,
    };

    setSaving(true);
    try {
      const saved = session ? await updateSession(session.id, input) : await createSession(input);
      onSaved(saved, !session);
      toast(session ? "Study session updated." : "Study session scheduled.");
      onClose();
    } catch (err) {
      setServerError(friendlyError(err, "We couldn't save this session."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={session ? "Edit study session" : "Schedule a study session"}
      description={session ? undefined : "Block out focused time for one subject."}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="session-form" loading={saving}>
            {session ? "Save changes" : "Schedule session"}
          </Button>
        </>
      }
    >
      <form id="session-form" onSubmit={onSubmit} noValidate className="space-y-5">
        {serverError && <Alert variant="error">{serverError}</Alert>}
        <Input
          label="Session title"
          placeholder="e.g. Revise integration by parts"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          error={errors.title}
          maxLength={120}
          required
        />
        <Select
          label="Subject"
          value={values.subject_id}
          onChange={(e) => set("subject_id", e.target.value)}
          hint={subjects.length === 0 ? undefined : "Link the session to a course."}
        >
          <option value="">No subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.code ? ` (${s.code})` : ""}
            </option>
          ))}
        </Select>
        {subjects.length === 0 && (
          <p className="-mt-3 text-sm text-slate-500">
            No subjects yet.{" "}
            <Link href="/subjects?new=1" className="font-medium text-brand-600 hover:text-brand-700">
              Create one first
            </Link>{" "}
            to keep sessions organised.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Date" type="date" value={values.date} onChange={(e) => set("date", e.target.value)} error={errors.date} required />
          <Input label="Start time" type="time" value={values.time} onChange={(e) => set("time", e.target.value)} error={errors.time} required />
          <Select label="Duration" value={values.duration} onChange={(e) => set("duration", e.target.value)} error={errors.duration}>
            {[...new Set([...DURATIONS, Number(values.duration)])]
              .sort((a, b) => a - b)
              .map((d) => (
                <option key={d} value={d}>
                  {d < 60 ? `${d} minutes` : `${d / 60} hour${d === 60 ? "" : "s"}`}
                </option>
              ))}
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Segmented
            label="Priority"
            value={values.priority}
            onChange={(v) => set("priority", v)}
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ]}
          />
          {session && (
            <Segmented
              label="Status"
              value={values.status}
              onChange={(v) => set("status", v)}
              options={[
                { value: "pending", label: "Pending" },
                { value: "completed", label: "Completed" },
              ]}
            />
          )}
        </div>
        <Textarea
          label="Notes for this session"
          optional
          rows={3}
          placeholder="Chapters to cover, past questions to try…"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </form>
    </Modal>
  );
}
