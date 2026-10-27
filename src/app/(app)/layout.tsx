import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { UserProvider } from "@/components/app/user-context";
import { supabaseServer } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";
import type { Profile } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) redirect("/login");

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  // Fall back gracefully if the profile row hasn't been created yet.
  const profile: Profile = data ?? {
    id: user.id,
    full_name: (user.user_metadata?.full_name as string) ?? "",
    email: user.email ?? null,
    university: null,
    programme: null,
    year_of_study: null,
    created_at: user.created_at,
  };

  return (
    <UserProvider initial={profile}>
      <AppShell>{children}</AppShell>
    </UserProvider>
  );
}
