import { CircleCheck, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { subjectColor } from "@/lib/colors";
import type { Priority, SessionStatus, SubjectRef } from "@/lib/db";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", className)}>
      {children}
    </span>
  );
}

const PRIORITY: Record<Priority, { label: string; cls: string }> = {
  high: { label: "High", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  medium: { label: "Medium", cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  low: { label: "Low", cls: "bg-slate-50 text-slate-600 ring-slate-200" },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const p = PRIORITY[priority];
  return (
    <Badge className={p.cls}>
      <span className="sr-only">Priority: </span>
      {p.label}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: SessionStatus }) {
  return status === "completed" ? (
    <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">
      <CircleCheck className="h-3 w-3" aria-hidden="true" /> Completed
    </Badge>
  ) : (
    <Badge className="bg-brand-50 text-brand-700 ring-brand-200">
      <Circle className="h-3 w-3" aria-hidden="true" /> Pending
    </Badge>
  );
}

export function SubjectBadge({ subject }: { subject: SubjectRef | null }) {
  if (!subject) return <Badge className="bg-slate-50 text-slate-500 ring-slate-200">No subject</Badge>;
  const c = subjectColor(subject.color);
  return (
    <Badge className={c.soft}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} aria-hidden="true" />
      {subject.name}
    </Badge>
  );
}
