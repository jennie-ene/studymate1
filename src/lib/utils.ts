export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function initials(name: string | null | undefined) {
  if (!name) return "S";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "S").toUpperCase() + (parts.length > 1 ? parts[parts.length - 1][0].toUpperCase() : "");
}

export function firstName(name: string | null | undefined) {
  return name?.trim().split(/\s+/)[0] || "there";
}

/** Turn Supabase / network errors into messages a student can act on. */
export function friendlyError(err: unknown, fallback = "Something went wrong. Please try again.") {
  const msg = (err as { message?: string })?.message ?? "";
  if (!msg) return fallback;
  if (/failed to fetch|network/i.test(msg)) return "We couldn't reach the server. Check your internet connection and try again.";
  if (/invalid login credentials/i.test(msg)) return "That email and password don't match. Please try again.";
  if (/email not confirmed/i.test(msg)) return "Please confirm your email address first — check your inbox for the link we sent.";
  if (/user already registered/i.test(msg)) return "An account with this email already exists. Try logging in instead.";
  if (/rate limit|too many/i.test(msg)) return "Too many attempts. Please wait a minute and try again.";
  if (/jwt|session/i.test(msg)) return "Your session has expired. Please log in again.";
  return msg;
}

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
);
