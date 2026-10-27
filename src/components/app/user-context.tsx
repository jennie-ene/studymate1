"use client";

import { createContext, useContext, useState } from "react";
import type { Profile } from "@/lib/db";

type Ctx = { profile: Profile; setProfile: (p: Profile) => void };
const UserContext = createContext<Ctx | null>(null);

export function UserProvider({ initial, children }: { initial: Profile; children: React.ReactNode }) {
  const [profile, setProfile] = useState(initial);
  return <UserContext.Provider value={{ profile, setProfile }}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>");
  return ctx;
}
