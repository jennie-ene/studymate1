import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo />
      <p className="mt-10 text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-slate-500">It may have been moved or deleted.</p>
      <Link href="/dashboard" className={buttonClasses({ className: "mt-6" })}>
        Go to dashboard
      </Link>
    </main>
  );
}
