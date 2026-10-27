"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, CalendarDays, ChevronLeft, ChevronRight, List, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/card";
import { Input, Segmented, Select } from "@/components/ui/field";
import { EmptyState, ErrorState, LoadingList } from "@/components/ui/feedback";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { SessionForm } from "@/components/app/session-form";
import { SessionRow } from "@/components/app/session-row";
import { deleteSession, listSessions, listSubjects, updateSession, type StudySession } from "@/lib/db";
import { addDays, formatDay, formatTime, isSameDay, startOfDay, startOfWeek } from "@/lib/date";
import { subjectColor } from "@/lib/colors";
import { useQuery } from "@/lib/use-query";
import { cn, friendlyError } from "@/lib/utils";

async function loadPlanner() {
  const [subjects, sessions] = await Promise.all([listSubjects(), listSessions()]);
  return { subjects, sessions };
}

type StatusFilter = "all" | "pending" | "completed";
type View = "list" | "week";

export default function PlannerPage() {
  return (
    <Suspense>
      <Planner />
    </Suspense>
  );
}

function Planner() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const { data, setData, loading, error, reload } = useQuery(loadPlanner);

  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState(params.get("subject") ?? "");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [priority, setPriority] = useState("");
  const [view, setView] = useState<View>("list");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudySession | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined);
  const [deleting, setDeleting] = useState<StudySession | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Support /planner?new=1 deep links from the dashboard.
  useEffect(() => {
    if (params.get("new") === "1" && !loading && data) {
      openCreate();
      router.replace("/planner");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, loading, data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.sessions.filter(
      (s) =>
        (!q || s.title.toLowerCase().includes(q) || s.subject?.name.toLowerCase().includes(q)) &&
        (!subjectFilter || s.subject_id === subjectFilter) &&
        (status === "all" || s.status === status) &&
        (!priority || s.priority === priority),
    );
  }, [data, query, subjectFilter, status, priority]);

  const groups = useMemo(() => {
    const today = startOfDay(new Date());
    const overdue = filtered.filter((s) => s.status === "pending" && new Date(s.scheduled_at) < today);
    const rest = filtered.filter((s) => !overdue.includes(s));
    const byDay = new Map<string, StudySession[]>();
    rest.forEach((s) => {
      const key = startOfDay(new Date(s.scheduled_at)).toISOString();
      byDay.set(key, [...(byDay.get(key) ?? []), s]);
    });
    // Upcoming days first (ascending), then past days (most recent first).
    const keys = [...byDay.keys()].sort();
    const future = keys.filter((k) => new Date(k) >= today);
    const past = keys.filter((k) => new Date(k) < today).reverse();
    return {
      overdue,
      days: [...future, ...past].map((k) => ({ date: new Date(k), items: byDay.get(k)! })),
    };
  }, [filtered]);

  function openCreate(date?: Date) {
    setEditing(null);
    setDefaultDate(date);
    setFormOpen(true);
  }

  function onSaved(s: StudySession, isNew: boolean) {
    setData(
      (d) =>
        d && {
          ...d,
          sessions: (isNew ? [...d.sessions, s] : d.sessions.map((x) => (x.id === s.id ? s : x))).sort((a, b) =>
            a.scheduled_at.localeCompare(b.scheduled_at),
          ),
        },
    );
  }

  async function toggle(s: StudySession) {
    setTogglingId(s.id);
    try {
      const updated = await updateSession(s.id, { status: s.status === "completed" ? "pending" : "completed" });
      onSaved(updated, false);
      toast(updated.status === "completed" ? "Nice work — session completed!" : "Session marked as pending.");
    } catch (e) {
      toast(friendlyError(e), "error");
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteSession(deleting.id);
      setData((d) => d && { ...d, sessions: d.sessions.filter((x) => x.id !== deleting.id) });
      toast("Study session deleted.");
      setDeleting(null);
    } catch (e) {
      toast(friendlyError(e), "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  const hasFilters = Boolean(query || subjectFilter || status !== "all" || priority);
  const clearFilters = () => {
    setQuery("");
    setSubjectFilter("");
    setStatus("all");
    setPriority("");
  };

  const rowProps = {
    onToggle: toggle,
    onEdit: (s: StudySession) => {
      setEditing(s);
      setFormOpen(true);
    },
    onDelete: setDeleting,
  };

  return (
    <>
      <PageHeader
        title="Study Planner"
        description="Schedule, track and complete your study sessions."
        action={
          <Button onClick={() => openCreate()} disabled={loading || !!error}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add session
          </Button>
        }
      />

      {/* Toolbar */}
      <Card className="mb-5 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
          <Input
            label="Search sessions"
            hideLabel
            type="search"
            placeholder="Search by title or subject…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leading={<Search className="h-4 w-4" aria-hidden="true" />}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Filter by subject" hideLabel value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option value="">All subjects</option>
              {data?.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Select label="Filter by priority" hideLabel value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">Any priority</option>
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </Select>
          </div>
          <Segmented
            label="View"
            hideLabel
            value={view}
            onChange={setView}
            options={[
              { value: "list", label: "List", icon: <List className="h-4 w-4" aria-hidden="true" /> },
              { value: "week", label: "Week", icon: <CalendarDays className="h-4 w-4" aria-hidden="true" /> },
            ]}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Segmented
            label="Filter by status"
            hideLabel
            size="sm"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All" },
              { value: "pending", label: "Pending" },
              { value: "completed", label: "Completed" },
            ]}
          />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      <p className="sr-only" aria-live="polite">
        {!loading && data ? `${filtered.length} session${filtered.length === 1 ? "" : "s"} shown` : ""}
      </p>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <LoadingList rows={4} label="Loading study sessions" />
      ) : data.sessions.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="h-6 w-6" />}
          title="Plan your first study session"
          description="Pick a subject, choose a time, and StudyMate will keep track of what's coming up and what you've completed."
          action={
            <Button onClick={() => openCreate()}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add session
            </Button>
          }
        />
      ) : view === "week" ? (
        <WeekView
          weekStart={weekStart}
          setWeekStart={setWeekStart}
          sessions={filtered}
          onAdd={openCreate}
          onOpen={rowProps.onEdit}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="No sessions match your filters"
          description="Try a different search term or clear the filters to see everything."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {groups.overdue.length > 0 && (
            <section aria-labelledby="overdue-heading">
              <h2 id="overdue-heading" className="mb-2 text-sm font-semibold text-rose-600">
                Overdue · {groups.overdue.length}
              </h2>
              <Card>
                <ul className="divide-y divide-slate-100">
                  {groups.overdue.map((s) => (
                    <SessionRow key={s.id} session={s} toggling={togglingId === s.id} {...rowProps} />
                  ))}
                </ul>
              </Card>
            </section>
          )}
          {groups.days.map(({ date, items }) => {
            const id = `day-${date.getTime()}`;
            return (
              <section key={id} aria-labelledby={id}>
                <h2 id={id} className="mb-2 text-sm font-semibold text-slate-700">
                  {formatDay(date)}
                  {!["Today", "Tomorrow", "Yesterday"].includes(formatDay(date)) ? "" : (
                    <span className="ml-2 font-normal text-slate-400">
                      {date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                  )}
                </h2>
                <Card>
                  <ul className="divide-y divide-slate-100">
                    {items.map((s) => (
                      <SessionRow key={s.id} session={s} toggling={togglingId === s.id} {...rowProps} />
                    ))}
                  </ul>
                </Card>
              </section>
            );
          })}
        </div>
      )}

      <SessionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        session={editing}
        subjects={data?.subjects ?? []}
        onSaved={onSaved}
        defaultDate={defaultDate}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteBusy}
        title="Delete this study session?"
        description={
          <>
            <span className="font-medium text-slate-900">&ldquo;{deleting?.title}&rdquo;</span> will be permanently removed
            from your planner and progress stats. This can&apos;t be undone.
          </>
        }
        confirmLabel="Delete session"
      />
    </>
  );
}

function WeekView({
  weekStart,
  setWeekStart,
  sessions,
  onAdd,
  onOpen,
}: {
  weekStart: Date;
  setWeekStart: (d: Date) => void;
  sessions: StudySession[];
  onAdd: (d: Date) => void;
  onOpen: (s: StudySession) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const end = days[6];
  const label = `${weekStart.toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${end.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <Card>
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900" aria-live="polite">
          {label}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            This week
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="grid divide-y divide-slate-100 md:grid-cols-7 md:divide-x md:divide-y-0">
        {days.map((d) => {
          const items = sessions.filter((s) => isSameDay(new Date(s.scheduled_at), d));
          const today = isSameDay(d, new Date());
          return (
            <div key={d.toISOString()} className="flex min-h-28 flex-col p-2.5 md:min-h-64">
              <div className="mb-2 flex items-center justify-between">
                <p className={cn("text-xs font-medium uppercase tracking-wide", today ? "text-brand-700" : "text-slate-500")}>
                  {d.toLocaleDateString(undefined, { weekday: "short" })}{" "}
                  <span
                    className={cn(
                      "ml-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm normal-case",
                      today ? "bg-brand-600 text-white" : "text-slate-900",
                    )}
                  >
                    {d.getDate()}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => onAdd(d)}
                  aria-label={`Add session on ${d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}`}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <ul className="space-y-1.5">
                {items.map((s) => {
                  const c = subjectColor(s.subject?.color);
                  const done = s.status === "completed";
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => onOpen(s)}
                        className={cn(
                          "w-full rounded-md border-l-[3px] px-2 py-1.5 text-left text-xs ring-1 ring-inset transition hover:shadow-sm",
                          s.subject ? c.soft : "bg-slate-50 text-slate-700 ring-slate-200",
                          done && "opacity-60",
                        )}
                        style={{ borderLeftColor: "currentColor" }}
                      >
                        <span className={cn("block truncate font-medium", done && "line-through")}>{s.title}</span>
                        <span className="opacity-80">
                          {formatTime(new Date(s.scheduled_at))} · {s.duration_minutes}m
                        </span>
                        <span className="sr-only">{done ? ", completed" : ", pending"}. Open to edit.</span>
                      </button>
                    </li>
                  );
                })}
                {items.length === 0 && <li className="py-2 text-center text-xs text-slate-300 md:pt-6">—</li>}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
