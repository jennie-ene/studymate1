/**
 * Subject colour palette. Full class names are written out so Tailwind can
 * detect them at build time. The `key` is what's stored in the database.
 */
export const SUBJECT_COLORS = {
  indigo: { label: "Indigo", dot: "bg-indigo-500", soft: "bg-indigo-50 text-indigo-700 ring-indigo-200", bar: "bg-indigo-500" },
  emerald: { label: "Emerald", dot: "bg-emerald-500", soft: "bg-emerald-50 text-emerald-700 ring-emerald-200", bar: "bg-emerald-500" },
  amber: { label: "Amber", dot: "bg-amber-500", soft: "bg-amber-50 text-amber-800 ring-amber-200", bar: "bg-amber-500" },
  rose: { label: "Rose", dot: "bg-rose-500", soft: "bg-rose-50 text-rose-700 ring-rose-200", bar: "bg-rose-500" },
  sky: { label: "Sky", dot: "bg-sky-500", soft: "bg-sky-50 text-sky-700 ring-sky-200", bar: "bg-sky-500" },
  violet: { label: "Violet", dot: "bg-violet-500", soft: "bg-violet-50 text-violet-700 ring-violet-200", bar: "bg-violet-500" },
  orange: { label: "Orange", dot: "bg-orange-500", soft: "bg-orange-50 text-orange-700 ring-orange-200", bar: "bg-orange-500" },
  teal: { label: "Teal", dot: "bg-teal-500", soft: "bg-teal-50 text-teal-700 ring-teal-200", bar: "bg-teal-500" },
} as const;

export type SubjectColor = keyof typeof SUBJECT_COLORS;
export const COLOR_KEYS = Object.keys(SUBJECT_COLORS) as SubjectColor[];

export function subjectColor(key: string | null | undefined) {
  return SUBJECT_COLORS[(key as SubjectColor) ?? "indigo"] ?? SUBJECT_COLORS.indigo;
}

export const SAMPLE_SUBJECTS: Array<{ name: string; code: string; color: SubjectColor }> = [
  { name: "Mathematics", code: "MTH 101", color: "indigo" },
  { name: "Computer Science", code: "CSC 201", color: "emerald" },
  { name: "Physics", code: "PHY 102", color: "amber" },
  { name: "English", code: "ENG 101", color: "rose" },
];
