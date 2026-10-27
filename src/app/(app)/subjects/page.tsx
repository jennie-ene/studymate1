"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, CalendarClock, NotebookPen, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { SubjectForm } from "@/components/app/subject-form";
import { createSubjects, deleteSubject, listSubjects, type Subject } from "@/lib/db";
import { SAMPLE_SUBJECTS, subjectColor } from "@/lib/colors";
import { useQuery } from "@/lib/use-query";
import { cn, friendlyError } from "@/lib/utils";

export default function SubjectsPage() {
  return (
    <Suspense>
      <Subjects />
    </Suspense>
  );
}

function Subjects() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const { data, setData, loading, error, reload } = useQuery(listSubjects);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState<Subject | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (params.get("new") === "1" && !loading) {
      setEditing(null);
      setFormOpen(true);
      router.replace("/subjects");
    }
  }, [params, loading, router]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteSubject(deleting.id);
      setData((d) => d && d.filter((s) => s.id !== deleting.id));
      toast(`${deleting.name} deleted.`);
      setDeleting(null);
    } catch (e) {
      toast(friendlyError(e), "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  async function addSamples() {
    setSeeding(true);
    try {
      const existing = new Set((data ?? []).map((s) => s.name.toLowerCase()));
      const toAdd = SAMPLE_SUBJECTS.filter((s) => !existing.has(s.name.toLowerCase()));
      if (toAdd.length) await createSubjects(toAdd);
      toast("Sample subjects added.");
      await reload();
    } catch (e) {
      toast(friendlyError(e), "error");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Subjects"
        description="The courses you're studying this semester."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            disabled={loading || !!error}
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add subject
          </Button>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <div role="status" aria-label="Loading subjects" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="space-y-3 p-5">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </Card>
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="Add your first subject"
          description="Subjects keep your study sessions and notes organised. Create one for each course you're taking."
          action={
            <>
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add subject
              </Button>
              <Button variant="outline" onClick={addSamples} loading={seeding}>
                Use sample subjects
              </Button>
            </>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((s) => {
            const c = subjectColor(s.color);
            return (
              <li key={s.id}>
                <Card className="relative h-full overflow-hidden">
                  <div className={cn("h-1.5", c.bar)} aria-hidden="true" />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", c.soft)} aria-hidden="true">
                          <BookOpen className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold text-slate-900">{s.name}</h2>
                          <p className="text-sm text-slate-500">{s.code || "No course code"}</p>
                        </div>
                      </div>
                      <div className="-mr-2 -mt-1 flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(s);
                            setFormOpen(true);
                          }}
                          aria-label={`Edit ${s.name}`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(s)} aria-label={`Delete ${s.name}`} className="hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <Link href={`/notes?subject=${s.id}`} className="rounded-lg bg-slate-50 p-3 transition-colors hover:bg-slate-100">
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" /> Notes
                        </p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">{s.notes_count}</p>
                      </Link>
                      <Link href={`/planner?subject=${s.id}`} className="rounded-lg bg-slate-50 p-3 transition-colors hover:bg-slate-100">
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> Sessions
                        </p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">{s.sessions_count}</p>
                      </Link>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <SubjectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        subject={editing}
        onSaved={reload}
        existingNames={data?.map((s) => s.name) ?? []}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteBusy}
        title={`Delete ${deleting?.name ?? "subject"}?`}
        description={
          deleting && deleting.notes_count + deleting.sessions_count > 0 ? (
            <>
              This subject has {deleting.notes_count} note{deleting.notes_count === 1 ? "" : "s"} and {deleting.sessions_count} study session
              {deleting.sessions_count === 1 ? "" : "s"}. They won&apos;t be deleted, but they&apos;ll no longer be linked to a subject.
            </>
          ) : (
            "This subject will be permanently deleted. This can't be undone."
          )
        }
        confirmLabel="Delete subject"
      />
    </>
  );
}
