"use client";

import { supabaseBrowser } from "@/lib/supabase/client";

/* ------------------------------------------------------------------ */
/* Types — mirror supabase/schema.sql                                  */
/* ------------------------------------------------------------------ */

export type Priority = "low" | "medium" | "high";
export type SessionStatus = "pending" | "completed";

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  university: string | null;
  programme: string | null;
  year_of_study: string | null;
  created_at: string;
}

export interface SubjectRef {
  id: string;
  name: string;
  code: string | null;
  color: string;
}

export interface Subject extends SubjectRef {
  created_at: string;
  notes_count: number;
  sessions_count: number;
}

export interface StudySession {
  id: string;
  title: string;
  subject_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  priority: Priority;
  status: SessionStatus;
  description: string | null;
  completed_at: string | null;
  created_at: string;
  subject: SubjectRef | null;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  subject_id: string | null;
  created_at: string;
  updated_at: string;
  subject: SubjectRef | null;
}

const SUBJECT_REF = "subject:subjects(id,name,code,color)";

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export async function getProfile(): Promise<Profile | null> {
  const sb = supabaseBrowser();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  return check(await sb.from("profiles").select("*").eq("id", auth.user.id).maybeSingle());
}

export async function updateProfile(id: string, values: Partial<Omit<Profile, "id" | "created_at" | "email">>) {
  const sb = supabaseBrowser();
  const profile = check(await sb.from("profiles").update(values).eq("id", id).select("*").single()) as Profile;
  if (values.full_name) await sb.auth.updateUser({ data: { full_name: values.full_name } });
  return profile;
}

/* ------------------------------------------------------------------ */
/* Subjects                                                            */
/* ------------------------------------------------------------------ */

type SubjectRow = SubjectRef & {
  created_at: string;
  notes: { count: number }[];
  study_sessions: { count: number }[];
};

export async function listSubjects(): Promise<Subject[]> {
  const rows = check(
    await supabaseBrowser()
      .from("subjects")
      .select("id,name,code,color,created_at,notes(count),study_sessions(count)")
      .order("name"),
  ) as SubjectRow[];
  return rows.map(({ notes, study_sessions, ...s }) => ({
    ...s,
    notes_count: notes?.[0]?.count ?? 0,
    sessions_count: study_sessions?.[0]?.count ?? 0,
  }));
}

export type SubjectInput = { name: string; code: string | null; color: string };

export async function createSubject(input: SubjectInput) {
  return check(await supabaseBrowser().from("subjects").insert(input).select("id").single());
}

export async function createSubjects(inputs: SubjectInput[]) {
  return check(await supabaseBrowser().from("subjects").insert(inputs).select("id"));
}

export async function updateSubject(id: string, input: SubjectInput) {
  return check(await supabaseBrowser().from("subjects").update(input).eq("id", id).select("id").single());
}

export async function deleteSubject(id: string) {
  check(await supabaseBrowser().from("subjects").delete().eq("id", id));
}

/* ------------------------------------------------------------------ */
/* Study sessions                                                      */
/* ------------------------------------------------------------------ */

export async function listSessions(): Promise<StudySession[]> {
  return check(
    await supabaseBrowser().from("study_sessions").select(`*, ${SUBJECT_REF}`).order("scheduled_at"),
  ) as StudySession[];
}

export type SessionInput = {
  title: string;
  subject_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  priority: Priority;
  status: SessionStatus;
  description: string | null;
};

export async function createSession(input: SessionInput) {
  return check(
    await supabaseBrowser()
      .from("study_sessions")
      .insert({ ...input, completed_at: input.status === "completed" ? new Date().toISOString() : null })
      .select(`*, ${SUBJECT_REF}`)
      .single(),
  ) as StudySession;
}

export async function updateSession(id: string, input: Partial<SessionInput>) {
  const patch: Record<string, unknown> = { ...input };
  if (input.status) patch.completed_at = input.status === "completed" ? new Date().toISOString() : null;
  return check(
    await supabaseBrowser().from("study_sessions").update(patch).eq("id", id).select(`*, ${SUBJECT_REF}`).single(),
  ) as StudySession;
}

export async function deleteSession(id: string) {
  check(await supabaseBrowser().from("study_sessions").delete().eq("id", id));
}

/* ------------------------------------------------------------------ */
/* Notes                                                               */
/* ------------------------------------------------------------------ */

export async function listNotes(): Promise<Note[]> {
  return check(
    await supabaseBrowser().from("notes").select(`*, ${SUBJECT_REF}`).order("updated_at", { ascending: false }),
  ) as Note[];
}

export type NoteInput = { title: string; content: string; subject_id: string | null };

export async function createNote(input: NoteInput) {
  return check(await supabaseBrowser().from("notes").insert(input).select(`*, ${SUBJECT_REF}`).single()) as Note;
}

export async function updateNote(id: string, input: NoteInput) {
  return check(
    await supabaseBrowser().from("notes").update(input).eq("id", id).select(`*, ${SUBJECT_REF}`).single(),
  ) as Note;
}

export async function deleteNote(id: string) {
  check(await supabaseBrowser().from("notes").delete().eq("id", id));
}
