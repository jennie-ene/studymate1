import { CalendarClock, LayoutDashboard, NotebookPen, BookOpen, Settings, CircleCheck } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";

/** Static, decorative replica of the dashboard used on the landing page. */
export function ProductPreview() {
  const bars = [40, 65, 30, 80, 55, 20, 45];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div
      role="img"
      aria-label="Preview of the StudyMate dashboard showing study stats, a weekly activity chart and upcoming sessions"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop"
    >
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="ml-3 h-5 flex-1 rounded-md bg-white text-[10px] leading-5 text-slate-400 ring-1 ring-slate-200">
          &nbsp;&nbsp;studymate.app/dashboard
        </span>
      </div>
      <div className="flex" aria-hidden="true">
        <div className="hidden w-40 shrink-0 border-r border-slate-100 p-3 sm:block">
          <div className="mb-4 flex items-center gap-2">
            <LogoMark className="h-6 w-6" />
            <span className="text-xs font-semibold">StudyMate</span>
          </div>
          {[
            [LayoutDashboard, "Dashboard", true],
            [CalendarClock, "Study Planner", false],
            [NotebookPen, "My Notes", false],
            [BookOpen, "Subjects", false],
            [Settings, "Settings", false],
          ].map(([Icon, label, active]) => {
            const I = Icon as typeof LayoutDashboard;
            return (
              <div
                key={label as string}
                className={`mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${active ? "bg-brand-50 font-medium text-brand-700" : "text-slate-500"}`}
              >
                <I className="h-3.5 w-3.5" />
                {label as string}
              </div>
            );
          })}
        </div>
        <div className="flex-1 space-y-3 bg-slate-50/60 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Good morning, Amara</p>
            <p className="text-[11px] text-slate-500">You have 3 sessions planned today.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {[
              ["Sessions", "24"],
              ["Completed", "18"],
              ["Notes", "37"],
              ["Hours", "21.5"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-slate-200 bg-white p-2.5">
                <p className="text-[10px] text-slate-500">{k}</p>
                <p className="text-base font-semibold text-slate-900">{v}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-2 md:grid-cols-5">
            <div className="rounded-lg border border-slate-200 bg-white p-3 md:col-span-3">
              <p className="mb-2 text-[11px] font-semibold text-slate-700">This week</p>
              <div className="flex h-20 items-end gap-2">
                {bars.map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className={`w-full rounded-sm ${i === 3 ? "bg-brand-600" : "bg-brand-200"}`} style={{ height: `${Math.round(h * 0.64)}px` }} />
                    <span className="text-[9px] text-slate-400">{days[i]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-3 md:col-span-2">
              <p className="text-[11px] font-semibold text-slate-700">Upcoming</p>
              {[
                ["Calculus revision", "bg-indigo-500", "10:00"],
                ["Data structures lab", "bg-emerald-500", "13:30"],
                ["Essay outline", "bg-rose-500", "16:00"],
              ].map(([t, c, time], i) => (
                <div key={t} className="flex items-center gap-2 text-[10px]">
                  {i === 0 ? <CircleCheck className="h-3 w-3 text-emerald-500" /> : <span className={`h-2 w-2 rounded-full ${c}`} />}
                  <span className={`flex-1 truncate ${i === 0 ? "text-slate-400 line-through" : "text-slate-700"}`}>{t}</span>
                  <span className="text-slate-400">{time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
