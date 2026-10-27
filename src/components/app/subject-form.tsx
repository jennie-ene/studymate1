"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { COLOR_KEYS, SUBJECT_COLORS, type SubjectColor } from "@/lib/colors";
import { createSubject, updateSubject, type Subject } from "@/lib/db";
import { cn, friendlyError } from "@/lib/utils";
import { validateRequired } from "@/lib/validation";

export function SubjectForm({
  open,
  onClose,
  subject,
  onSaved,
  existingNames,
}: {
  open: boolean;
  onClose: () => void;
  subject?: Subject | null;
  onSaved: () => void;
  existingNames: string[];
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [color, setColor] = useState<SubjectColor>("indigo");
  const [errors, setErrors] = useState<{ name?: string | null; code?: string | null }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(subject?.name ?? "");
    setCode(subject?.code ?? "");
    // Suggest a colour that isn't used yet for new subjects.
    setColor((subject?.color as SubjectColor) ?? COLOR_KEYS[existingNames.length % COLOR_KEYS.length]);
    setErrors({});
    setServerError(null);
  }, [open, subject, existingNames.length]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const duplicate = existingNames.some(
      (n) => n.toLowerCase() === name.trim().toLowerCase() && n.toLowerCase() !== subject?.name.toLowerCase(),
    );
    const errs = {
      name: validateRequired(name, "Subject name", 80) ?? (duplicate ? "You already have a subject with this name." : null),
      code: code.trim().length > 20 ? "Course code must be 20 characters or fewer." : null,
    };
    setErrors(errs);
    if (errs.name || errs.code) return;

    setSaving(true);
    try {
      const input = { name: name.trim(), code: code.trim().toUpperCase() || null, color };
      if (subject) await updateSubject(subject.id, input);
      else await createSubject(input);
      toast(subject ? "Subject updated." : `${input.name} added to your subjects.`);
      onSaved();
      onClose();
    } catch (err) {
      setServerError(friendlyError(err, "We couldn't save this subject."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={subject ? "Edit subject" : "Create a subject"}
      description={subject ? undefined : "Add a course you're taking this semester."}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="subject-form" loading={saving}>
            {subject ? "Save changes" : "Create subject"}
          </Button>
        </>
      }
    >
      <form id="subject-form" onSubmit={onSubmit} noValidate className="space-y-5">
        {serverError && <Alert variant="error">{serverError}</Alert>}
        <Input label="Subject name" placeholder="e.g. Mathematics" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={80} required />
        <Input label="Course code" optional placeholder="e.g. MTH 101" value={code} onChange={(e) => setCode(e.target.value)} error={errors.code} maxLength={20} />
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">Colour</legend>
          <div role="radiogroup" aria-label="Subject colour" className="flex flex-wrap gap-2.5">
            {COLOR_KEYS.map((k) => {
              const active = color === k;
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={SUBJECT_COLORS[k].label}
                  onClick={() => setColor(k)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full ring-offset-2 transition",
                    SUBJECT_COLORS[k].dot,
                    active ? "ring-2 ring-slate-900" : "hover:scale-105",
                  )}
                >
                  {active && <Check className="h-4 w-4 text-white" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
