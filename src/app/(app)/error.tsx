"use client";

import { ErrorState } from "@/components/ui/feedback";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState message={error.message || "This page failed to load."} onRetry={reset} />;
}
