"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, NotebookPen, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { SubjectBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { NoteEditor } from "@/components/app/note-editor";
import { deleteNote, listNotes, listSubjects, type Note } from "@/lib/db";
import { relativeTime } from "@/lib/date";
import { subjectColor } from "@/lib/colors";
import { useQuery } from "@/lib/use-query";
import { cn, friendlyError } from "@/lib/utils";

async function loadNotes() {
  const [subjects, notes] = await Promise.all([listSubjects(), listNotes()]);
  return { subjects, notes };
}

export default function NotesPage() {
  return (
    <Suspense>
      <Notes />
    </Suspense>
  );
}

function Notes() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const { data, setData, loading, error, reload } = useQuery(loadNotes);

  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState(params.get("subject") ?? "");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState<Note | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Deep links: /notes?new=1 and /notes?open=<id>
  useEffect(() => {
    if (loading || !data) return;
    const openId = params.get("open");
    if (params.get("new") === "1") {
      openEditor(null);
      router.replace("/notes");
    } else if (openId) {
      const n = data.notes.find((x) => x.id === openId);
      if (n) openEditor(n);
      router.replace("/notes");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, loading, data]);

  function openEditor(n: Note | null) {
    setEditing(n);
    setEditorOpen(true);
  }

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.notes.filter(
      (n) =>
        (!subjectFilter || (subjectFilter === "none" ? !n.subject_id : n.subject_id === subjectFilter)) &&
        (!q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)),
    );
  }, [data, query, subjectFilter]);

  function onSaved(n: Note, isNew: boolean) {
    setData((d) => d && { ...d, notes: isNew ? [n, ...d.notes] : [n, ...d.notes.filter((x) => x.id !== n.id)] });
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteNote(deleting.id);
      setData((d) => d && { ...d, notes: d.notes.filter((x) => x.id !== deleting.id) });
      toast("Note deleted.");
      setDeleting(null);
    } catch (e) {
      toast(friendlyError(e), "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  const chips = [
    { id: "", label: "All", color: null as string | null },
    ...(data?.subjects.map((s) => ({ id: s.id, label: s.name, color: s.color })) ?? []),
  ];

  return (
    <>
      <PageHeader
        title="My Notes"
        description="Your course notes, organised by subject."
        action={
          <Button onClick={() => openEditor(null)} disabled={loading || !!error}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Create note
          </Button>
        }
      />

      <div className="mb-5 space-y-3">
        <Input
          label="Search notes"
          hideLabel
          type="search"
          placeholder="Search titles and content…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leading={<Search className="h-4 w-4" aria-hidden="true" />}
          wrapperClassName="max-w-xl"
        />
        {data && data.subjects.length > 0 && (
          <div role="group" aria-label="Filter notes by subject" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {chips.map((c) => {
              const active = subjectFilter === c.id;
              return (
                <button
                  key={c.id || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSubjectFilter(c.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                  )}
                >
                  {c.color && <span className={cn("h-2 w-2 rounded-full", subjectColor(c.color).dot, active && "ring-2 ring-white/60")} aria-hidden="true" />}
                  {c.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {!loading && data ? `${filtered.length} note${filtered.length === 1 ? "" : "s"} shown` : ""}
      </p>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <div role="status" aria-label="Loading notes" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="space-y-3 p-5">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-14 w-full" />
            </Card>
          ))}
        </div>
      ) : data.notes.length === 0 ? (
        <EmptyState
          icon={<NotebookPen className="h-6 w-6" />}
          title="Write your first note"
          description="Summarise a lecture, save key formulas or jot down questions for your tutor — all organised by subject."
          action={
            <Button onClick={() => openEditor(null)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Create note
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="No notes found"
          description={query ? `Nothing matches “${query}”. Try another word or clear the filters.` : "There are no notes for this subject yet."}
          action={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setSubjectFilter("");
                }}
              >
                Clear filters
              </Button>
              {!query && subjectFilter && (
                <Button onClick={() => openEditor(null)}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> Create note
                </Button>
              )}
            </>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((n) => (
            <li key={n.id}>
              <Card className="group flex h-full flex-col transition-shadow hover:shadow-md">
                <button
                  type="button"
                  onClick={() => openEditor(n)}
                  className="flex flex-1 flex-col rounded-t-xl p-5 text-left"
                  aria-label={`Open note: ${n.title}`}
                >
                  <SubjectBadge subject={n.subject} />
                  <h2 className="mt-3 line-clamp-2 font-semibold text-slate-900">{n.title}</h2>
                  <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-slate-500">
                    {n.content.trim() || <span className="italic text-slate-400">Empty note</span>}
                  </p>
                </button>
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-2.5">
                  <p className="flex items-center gap-1.5 text-xs text-slate-400">
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      Updated <time dateTime={n.updated_at}>{relativeTime(n.updated_at)}</time>
                    </span>
                  </p>
                  <div className="flex">
                    <Button variant="ghost" size="icon" onClick={() => openEditor(n)} aria-label={`Edit note: ${n.title}`}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleting(n)}
                      aria-label={`Delete note: ${n.title}`}
                      className="hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <NoteEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        note={editing}
        subjects={data?.subjects ?? []}
        onSaved={onSaved}
        defaultSubjectId={subjectFilter && subjectFilter !== "none" ? subjectFilter : undefined}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteBusy}
        title="Delete this note?"
        description={
          <>
            <span className="font-medium text-slate-900">&ldquo;{deleting?.title}&rdquo;</span> and everything in it will be
            permanently deleted. This can&apos;t be undone.
          </>
        }
        confirmLabel="Delete note"
      />
    </>
  );
}
