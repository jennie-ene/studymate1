"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { createNote, updateNote, type Note, type SubjectRef } from "@/lib/db";
import { friendlyError } from "@/lib/utils";
import { validateRequired } from "@/lib/validation";

const MAX_CONTENT = 20000;

export function NoteEditor({
  open,
  onClose,
  note,
  subjects,
  onSaved,
  defaultSubjectId,
}: {
  open: boolean;
  onClose: () => void;
  note?: Note | null;
  subjects: SubjectRef[];
  onSaved: (n: Note, isNew: boolean) => void;
  defaultSubjectId?: string;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<{ title?: string | null; content?: string | null }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(note?.title ?? "");
    setSubjectId(note?.subject_id ?? defaultSubjectId ?? "");
    setContent(note?.content ?? "");
    setErrors({});
    setServerError(null);
  }, [open, note, defaultSubjectId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const errs = {
      title: validateRequired(title, "Note title", 150),
      content: content.length > MAX_CONTENT ? `Notes can be up to ${MAX_CONTENT.toLocaleString()} characters.` : null,
    };
    setErrors(errs);
    if (errs.title || errs.content) return;

    setSaving(true);
    try {
      const input = { title: title.trim(), content, subject_id: subjectId || null };
      const saved = note ? await updateNote(note.id, input) : await createNote(input);
      onSaved(saved, !note);
      toast(note ? "Note saved." : "Note created.");
      onClose();
    } catch (err) {
      setServerError(friendlyError(err, "We couldn't save your note. Your text is still here — try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={note ? "Edit note" : "New note"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="note-form" loading={saving}>
            {note ? "Save note" : "Create note"}
          </Button>
        </>
      }
    >
      <form id="note-form" onSubmit={onSubmit} noValidate className="space-y-5">
        {serverError && <Alert variant="error">{serverError}</Alert>}
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            wrapperClassName="sm:col-span-2"
            label="Title"
            placeholder="e.g. Newton's laws of motion"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            maxLength={150}
            required
          />
          <Select label="Subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">No subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Textarea
            label="Note content"
            rows={14}
            placeholder="Start writing… key definitions, formulas, summaries of lectures."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            error={errors.content}
            className="min-h-64 font-[inherit]"
          />
          <p className="mt-1.5 text-right text-xs text-slate-400" aria-live="polite">
            {content.trim() ? content.trim().split(/\s+/).length : 0} words
          </p>
        </div>
      </form>
    </Modal>
  );
}
