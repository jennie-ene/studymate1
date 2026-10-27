"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CircleCheck,
  Clock,
  NotebookPen,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { SubjectBadge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { SessionForm } from "@/components/app/session-form";
import { SessionRow } from "@/components/app/session-row";
import { WeeklyChart } from "@/components/app/weekly-chart";
import { useUser } from "@/components/app/user-context";
import { createSubjects, listNotes, listSessions, listSubjects, updateSession, type StudySession } from "@/lib/db";
import { greeting, relativeTime, startOfDay } from "@/lib/date";
import { SAMPLE_SUBJECTS } from "@/lib/colors";
import { useQuery } from "@/lib/use-query";
import { cn, firstName, friendlyError } from "@/lib/utils";

async function loadDashboard() {
  const [subjects, sessions, notes] = await Promise.all([listSubjects(), listSessions(), listNotes()]);
  return { subjects, sessions, notes };
}

export default function DashboardPage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const { profile } = useUser();
  const { toast } = useToast();
  const params = useSearchParams();
  const { data, setData, loading, error, reload } = useQuery(loadDashboard);
  const [formOpen, setFormOpen] = useState(false);
  const [hello, setHello] = useState("Welcome");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Time-based greeting is computed in the browser so it uses the student's local time.
  useEffect(() => setHello(greeting()), []);

  const stats = useMemo(() => {
    if (!data) return null;
    const completed = data.sessions.filter((s) => s.status === "completed");
    const minutes = completed.reduce((m, s) => m + s.duration_minutes, 0);
    const today = startOfDay(new Date());
    const upcoming = data.sessions.filter((s) => s.status === "pending" && new Date(s.scheduled_at) >= today).slice(0, 5);
    const todayCount = data.sessions.filter(
      (s) => s.status === "pending" && startOfDay(new Date(s.scheduled_at)).getTime() === today.getTime(),
    ).length;
    return {
      total: data.sessions.length,
      completed: completed.length,
      notes: data.notes.length,
      hours: Math.round((minutes / 60) * 10) / 10,
      rate: data.sessions.length ? Math.round((completed.length / data.sessions.length) * 100) : 0,
      upcoming,
      todayCount,
    };
  }, [data]);

  async function toggle(s: StudySession) {
    setTogglingId(s.id);
    try {
      const updated = await updateSession(s.id, { status: s.status === "completed" ? "pending" : "completed" });
      setData((d) => d && { ...d, sessions: d.sessions.map((x) => (x.id === s.id ? updated : x)) });
      toast(updated.status === "completed" ? "Nice work — session completed!" : "Session marked as pending.");
    } catch (e) {
      toast(friendlyError(e), "error");
    } finally {
      setTogglingId(null);
    }
  }

  async function addSampleSubjects() {
    setSeeding(true);
    try {
      await createSubjects(SAMPLE_SUBJECTS);
      toast("Added Mathematics, Computer Science, Physics and English.");
      await reload();
    } catch (e) {
      toast(friendlyError(e), "error");
    } finally {
      setSeeding(false);
    }
  }

  const isNew = data && data.subjects.length === 0 && data.sessions.length === 0 && data.notes.length === 0;
  const steps = data
    ? [
        { done: data.subjects.length > 0, label: "Create your first subject", href: "/subjects?new=1", icon: BookOpen },
        { done: data.sessions.length > 0, label: "Schedule a study session", action: () => setFormOpen(true), icon: CalendarClock },
        { done: data.notes.length > 0, label: "Write your first note", href: "/notes?new=1", icon: NotebookPen },
        { done: (stats?.completed ?? 0) > 0, label: "Complete a session to track progress", href: "/planner", icon: Target },
      ]
    : [];
  const stepsDone = steps.filter((s) => s.done).length;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {hello}, {firstName(profile.full_name)}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading || !stats
              ? "Here's your study overview."
              : stats.todayCount > 0
                ? `You have ${stats.todayCount} study session${stats.todayCount === 1 ? "" : "s"} planned for today.`
                : "Nothing planned for today yet — a short session goes a long way."}
          </p>
        </div>
        <Button size="lg" onClick={() => setFormOpen(true)} disabled={loading || !!error}>
          <Plus className="h-5 w-5" aria-hidden="true" /> Schedule study session
        </Button>
      </div>

      {params.get("welcome") && !loading && isNew && (
        <div className="mb-6 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 p-5 text-white">
          <p className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5" aria-hidden="true" /> Your account is ready!
          </p>
          <p className="mt-1 text-sm text-brand-100">Follow the steps below to set up your semester.</p>
        </div>
      )}

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data || !stats ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Getting started / progress checklist */}
          {stepsDone < steps.length && (
            <Card>
              <CardHeader
                title={isNew ? "Get started with StudyMate" : "Finish setting up"}
                description={`${stepsDone} of ${steps.length} steps complete`}
                action={
                  isNew ? (
                    <Button variant="secondary" size="sm" onClick={addSampleSubjects} loading={seeding}>
                      Add sample subjects
                    </Button>
                  ) : undefined
                }
              />
              <div className="px-5 pb-1 pt-4">
                <div
                  className="h-2 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label="Setup progress"
                  aria-valuenow={stepsDone}
                  aria-valuemin={0}
                  aria-valuemax={steps.length}
                >
                  <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${(stepsDone / steps.length) * 100}%` }} />
                </div>
              </div>
              <ol className="grid gap-2 p-5 sm:grid-cols-2">
                {steps.map((s, i) => {
                  const inner = (
                    <>
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                          s.done ? "bg-emerald-100 text-emerald-700" : "bg-brand-50 text-brand-700",
                        )}
                        aria-hidden="true"
                      >
                        {s.done ? <CircleCheck className="h-4 w-4" /> : i + 1}
                      </span>
                      <span className={cn("flex-1 text-sm font-medium", s.done ? "text-slate-400 line-through" : "text-slate-800")}>
                        {s.label}
                        <span className="sr-only">{s.done ? " (done)" : ""}</span>
                      </span>
                      {!s.done && <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />}
                    </>
                  );
                  const cls = "flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40";
                  return (
                    <li key={s.label}>
                      {s.done ? (
                        <div className={cn(cls, "pointer-events-none bg-slate-50")}>{inner}</div>
                      ) : s.href ? (
                        <Link href={s.href} className={cls}>
                          {inner}
                        </Link>
                      ) : (
                        <button type="button" onClick={s.action} className={cls}>
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
            </Card>
          )}

          {/* Summary cards */}
          <section aria-label="Study summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Study sessions" value={stats.total} icon={CalendarDays} tone="brand" />
            <StatCard label="Completed" value={stats.completed} icon={CircleCheck} tone="emerald" sub={stats.total ? `${stats.rate}% completion` : undefined} />
            <StatCard label="Notes" value={stats.notes} icon={NotebookPen} tone="amber" />
            <StatCard label="Study hours" value={stats.hours} icon={Clock} tone="sky" sub="From completed sessions" />
          </section>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Upcoming sessions */}
            <Card className="lg:col-span-3">
              <CardHeader
                title="Upcoming study sessions"
                action={
                  <Link href="/planner" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                    View planner
                  </Link>
                }
              />
              {stats.upcoming.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    className="border-none py-8"
                    icon={<CalendarClock className="h-6 w-6" />}
                    title="No upcoming sessions"
                    description="Plan your next study block so you know exactly what to work on."
                    action={
                      <Button variant="secondary" onClick={() => setFormOpen(true)}>
                        <Plus className="h-4 w-4" aria-hidden="true" /> Schedule a session
                      </Button>
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {stats.upcoming.map((s) => (
                    <SessionRow key={s.id} session={s} onToggle={toggle} toggling={togglingId === s.id} compact />
                  ))}
                </ul>
              )}
            </Card>

            {/* Weekly activity */}
            <Card className="lg:col-span-2">
              <CardHeader title="Weekly study activity" />
              <div className="p-5">
                <WeeklyChart sessions={data.sessions} />
              </div>
            </Card>
          </div>

          {/* Recent notes */}
          <Card>
            <CardHeader
              title="Recent notes"
              action={
                <Link href="/notes" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                  All notes
                </Link>
              }
            />
            {data.notes.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  className="border-none py-8"
                  icon={<NotebookPen className="h-6 w-6" />}
                  title="No notes yet"
                  description="Capture key ideas from lectures and readings so revision is easier later."
                  action={
                    <Link href="/notes?new=1" className={buttonClasses({ variant: "secondary" })}>
                      <Plus className="h-4 w-4" aria-hidden="true" /> Create a note
                    </Link>
                  }
                />
              </div>
            ) : (
              <ul className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.notes.slice(0, 3).map((n) => (
                  <li key={n.id}>
                    <Link
                      href={`/notes?open=${n.id}`}
                      className="block h-full rounded-lg border border-slate-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/30"
                    >
                      <SubjectBadge subject={n.subject} />
                      <p className="mt-2.5 truncate font-medium text-slate-900">{n.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{n.content || "No content yet."}</p>
                      <p className="mt-3 text-xs text-slate-400">Updated {relativeTime(n.updated_at)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <SessionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        subjects={data?.subjects ?? []}
        onSaved={(s) => setData((d) => d && { ...d, sessions: [...d.sessions, s].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)) })}
      />
    </>
  );
}

const TONES = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  sky: "bg-sky-50 text-sky-600",
};

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  sub,
}: {
  label: string;
  value: number;
  icon: typeof Clock;
  tone: keyof typeof TONES;
  sub?: string;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", TONES[tone])} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading your dashboard" className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="space-y-3 p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="space-y-4 p-5 lg:col-span-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
        <Card className="p-5 lg:col-span-2">
          <Skeleton className="h-48 w-full" />
        </Card>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
