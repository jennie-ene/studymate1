"use client";

import { Clock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge, SubjectBadge } from "@/components/ui/badge";
import type { StudySession } from "@/lib/db";
import { formatDay, formatDuration, formatTime } from "@/lib/date";
import { subjectColor } from "@/lib/colors";
import { cn } from "@/lib/utils";

/** One study session — shared by the dashboard and the planner. */
export function SessionRow({
  session,
  onToggle,
  onEdit,
  onDelete,
  toggling,
  compact,
}: {
  session: StudySession;
  onToggle: (s: StudySession) => void;
  onEdit?: (s: StudySession) => void;
  onDelete?: (s: StudySession) => void;
  toggling?: boolean;
  compact?: boolean;
}) {
  const d = new Date(session.scheduled_at);
  const done = session.status === "completed";
  const overdue = !done && d.getTime() + session.duration_minutes * 60000 < Date.now();
  const c = subjectColor(session.subject?.color);

  return (
    <li className={cn("group relative flex items-start gap-3 px-4 py-3.5 sm:px-5", done && "bg-slate-50/60")}>
      <span className={cn("absolute inset-y-3 left-0 w-1 rounded-r-full", session.subject ? c.bar : "bg-slate-200")} aria-hidden="true" />
      <input
        type="checkbox"
        checked={done}
        disabled={toggling}
        onChange={() => onToggle(session)}
        aria-label={done ? `Mark "${session.title}" as pending` : `Mark "${session.title}" as completed`}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-brand-600 disabled:cursor-wait"
      />
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium text-slate-900", done && "text-slate-500 line-through decoration-slate-300")}>{session.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-slate-500">
          <SubjectBadge subject={session.subject} />
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDay(d)}, {formatTime(d)} · {formatDuration(session.duration_minutes)}
          </span>
          {overdue && <span className="text-xs font-medium text-rose-600">Overdue</span>}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
        {!compact && <StatusBadge status={session.status} />}
        <PriorityBadge priority={session.priority} />
        {(onEdit || onDelete) && (
          <div className="flex">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={() => onEdit(session)} aria-label={`Edit "${session.title}"`}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(session)}
                aria-label={`Delete "${session.title}"`}
                className="hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
