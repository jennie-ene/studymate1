import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#4f46e5" />
      <path d="M9 10.5c2.6-.9 4.9-.6 7 1v11c-2.1-1.6-4.4-1.9-7-1v-11Z" fill="#c7d2fe" />
      <path d="M23 10.5c-2.6-.9-4.9-.6-7 1v11c2.1-1.6 4.4-1.9 7-1v-11Z" fill="#fff" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 rounded-lg", className)} aria-label="StudyMate home">
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight text-slate-900">StudyMate</span>
    </Link>
  );
}
