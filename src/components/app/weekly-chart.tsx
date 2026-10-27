"use client";

import { useMemo } from "react";
import type { StudySession } from "@/lib/db";
import { addDays, isSameDay, startOfWeek } from "@/lib/date";
import { cn } from "@/lib/utils";

/**
 * Bar chart of completed study minutes for each day of the current week.
 * Pure CSS (no chart library) and paired with a screen-reader table.
 */
export function WeeklyChart({ sessions }: { sessions: StudySession[] }) {
  const { days, maxMinutes, totalMinutes } = useMemo(() => {
    const start = startOfWeek(new Date());
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i);
      const minutes = sessions
        .filter((s) => s.status === "completed" && isSameDay(new Date(s.scheduled_at), date))
        .reduce((sum, s) => sum + s.duration_minutes, 0);
      const planned = sessions
        .filter((s) => s.status === "pending" && isSameDay(new Date(s.scheduled_at), date))
        .reduce((sum, s) => sum + s.duration_minutes, 0);
      return { date, minutes, planned, isToday: isSameDay(date, new Date()) };
    });
    const maxMinutes = Math.max(60, ...days.map((d) => d.minutes + d.planned));
    const totalMinutes = days.reduce((s, d) => s + d.minutes, 0);
    return { days, maxMinutes, totalMinutes };
  }, [sessions]);

  const hours = (m: number) => (m / 60).toFixed(m % 60 === 0 ? 0 : 1);

  return (
    <div className="relative">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-sm text-slate-500">
          <span className="text-2xl font-semibold text-slate-900">{hours(totalMinutes)} h</span> studied this week
        </p>
        <div className="flex gap-3 text-xs text-slate-500" aria-hidden="true">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand-600" /> Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand-200" /> Planned
          </span>
        </div>
      </div>

      <div className="flex h-44 items-end gap-2 sm:gap-3" aria-hidden="true">
        {days.map((d) => (
          <div key={d.date.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div className="flex w-full max-w-10 flex-1 flex-col justify-end">
              {d.planned > 0 && (
                <div
                  className={cn("w-full bg-brand-200", d.minutes === 0 ? "rounded-md" : "rounded-t-md")}
                  style={{ height: `${(d.planned / maxMinutes) * 100}%` }}
                  title={`${d.planned} min planned`}
                />
              )}
              {d.minutes > 0 && (
                <div
                  className={cn("w-full bg-brand-600", d.planned === 0 ? "rounded-md" : "rounded-b-md")}
                  style={{ height: `${(d.minutes / maxMinutes) * 100}%` }}
                  title={`${d.minutes} min completed`}
                />
              )}
              {d.minutes === 0 && d.planned === 0 && <div className="h-1 w-full rounded-full bg-slate-100" />}
            </div>
            <span className={cn("text-xs", d.isToday ? "font-semibold text-brand-700" : "text-slate-500")}>
              {d.date.toLocaleDateString(undefined, { weekday: "short" })}
            </span>
          </div>
        ))}
      </div>

      <div className="sr-only"><table>
        <caption>Study minutes per day this week</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Completed minutes</th>
            <th scope="col">Planned minutes</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date.toISOString()}>
              <th scope="row">{d.date.toLocaleDateString(undefined, { weekday: "long" })}</th>
              <td>{d.minutes}</td>
              <td>{d.planned}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}
