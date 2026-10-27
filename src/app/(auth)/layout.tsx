import { CalendarClock, ChartColumn, NotebookPen } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Alert } from "@/components/ui/feedback";
import { isSupabaseConfigured } from "@/lib/utils";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <main className="flex flex-col px-4 py-6 sm:px-8">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            {!isSupabaseConfigured && (
              <Alert variant="warning" title="Database not connected" className="mb-6">
                Add your Supabase URL and anon key as environment variables to enable sign-in. See the README.
              </Alert>
            )}
            {children}
          </div>
        </div>
      </main>
      <aside className="relative hidden overflow-hidden bg-brand-600 lg:flex lg:flex-col lg:justify-center lg:px-16" aria-hidden="true">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/50" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand-700/60" />
        <div className="relative max-w-md">
          <p className="text-3xl font-semibold leading-tight text-white">
            Your semester, organised — one study session at a time.
          </p>
          <ul className="mt-10 space-y-5 text-brand-50">
            {[
              [CalendarClock, "Plan focused study sessions for every course"],
              [NotebookPen, "Keep all your notes organised by subject"],
              [ChartColumn, "See your weekly progress at a glance"],
            ].map(([Icon, text]) => {
              const I = Icon as typeof CalendarClock;
              return (
                <li key={text as string} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                    <I className="h-5 w-5" />
                  </span>
                  {text as string}
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
