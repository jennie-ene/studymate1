import Link from "next/link";
import { ArrowRight, BookOpen, CalendarClock, ChartColumn, CircleCheck, NotebookPen } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { buttonClasses } from "@/components/ui/button";
import { ProductPreview } from "@/components/marketing/product-preview";

const features = [
  {
    icon: CalendarClock,
    title: "Study planner",
    body: "Schedule sessions with a subject, time, duration and priority. Tick them off as you go.",
  },
  {
    icon: NotebookPen,
    title: "Course notes",
    body: "Write and organise notes by subject, then find any of them in seconds with search and filters.",
  },
  {
    icon: BookOpen,
    title: "Subjects in one place",
    body: "Group everything by course — Mathematics, Computer Science, Physics — with its own colour and code.",
  },
  {
    icon: ChartColumn,
    title: "Progress you can see",
    body: "Your dashboard shows completed sessions, study hours and a weekly activity chart.",
  },
];

const steps = [
  { title: "Add your subjects", body: "Create a subject for each course you're taking this semester." },
  { title: "Plan study sessions", body: "Block out focused time for each subject and set priorities." },
  { title: "Take notes & track progress", body: "Capture notes as you study and watch your weekly hours grow." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-pop"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/85 backdrop-blur">
        <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900">How it works</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonClasses({ variant: "ghost", size: "sm" })}>
              Log in
            </Link>
            <Link href="/signup" className={buttonClasses({ size: "sm" })}>
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--color-brand-100),transparent)]"
          />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-brand-700">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                Built for university students
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Plan smarter. Study calmer.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">
                StudyMate brings your study schedule, course notes and progress into one simple, distraction-free
                space — so you always know what to study next.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/signup" className={buttonClasses({ size: "lg" })}>
                  Get started — it&apos;s free <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/login" className={buttonClasses({ variant: "outline", size: "lg" })}>
                  Log in
                </Link>
              </div>
              <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
                {["Free for students", "Works on any device", "Your data stays private"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <CircleCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mx-auto mt-14 max-w-5xl">
              <ProductPreview />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" aria-labelledby="features-title" className="border-t border-slate-100 bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 id="features-title" className="text-3xl font-semibold tracking-tight text-slate-900">
                Everything you need for the semester
              </h2>
              <p className="mt-3 text-slate-600">Four focused tools that work together. Nothing you don&apos;t need.</p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <f.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" aria-labelledby="how-title" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="how-title" className="text-3xl font-semibold tracking-tight text-slate-900">
              Up and running in three steps
            </h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title} className="relative rounded-xl border border-slate-200 p-6">
                  <span className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-6xl rounded-2xl bg-brand-600 px-6 py-12 text-center sm:px-12">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">Ready to get organised?</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100">
              Create your free account and plan your first study session in under two minutes.
            </p>
            <Link
              href="/signup"
              className={buttonClasses({
                size: "lg",
                variant: "outline",
                className: "mt-8 border-white bg-white text-brand-700 hover:bg-brand-50",
              })}
            >
              Create your account <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6">
          <Logo />
          <p>© {new Date().getFullYear()} StudyMate. A student capstone project.</p>
        </div>
      </footer>
    </div>
  );
}
