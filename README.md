# StudyMate

A study planning and academic notes platform for university students — plan study sessions, organise notes by subject, and track progress in one calm, distraction-free place.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres + Auth) · Vercel

---

## 1. Features

| Screen | What it does |
|---|---|
| Landing (`/`) | Hero, feature overview, how-it-works, product preview, Get Started / Log In |
| Sign up (`/signup`) | Full name, email, password with live requirement checklist and visibility toggle |
| Log in (`/login`) | Email, password, show/hide, Forgot password link, redirect back to the page you wanted |
| Forgot / reset password | Sends a reset link; confirmation, resend and expired-link states |
| Dashboard (`/dashboard`) | Personal greeting, 4 summary cards, upcoming sessions (tick to complete), weekly activity chart, recent notes, getting-started checklist for new users |
| Study Planner (`/planner`) | List view (grouped by day, overdue highlighted) and week calendar view; search; filter by subject, status, priority; create/edit/delete |
| My Notes (`/notes`) | Search, subject filter chips, note cards with preview and "updated" time, editor (title, subject, content), delete with confirmation |
| Subjects (`/subjects`) | Cards with name, course code, colour, note and session counts; create/edit/delete; one-click sample subjects |
| Settings (`/settings`) | Profile editing (name, university, programme, year), change password, log out |

Every data screen has **loading** (skeletons), **error** (with Try again), **empty** and **success** (toast) states. Every delete and log-out asks for confirmation first.

---

## 2. Set up Supabase (≈5 minutes)

1. Go to [supabase.com](https://supabase.com), sign in and click **New project**. Pick a name (e.g. `studymate`), a database password and the region closest to your users.
2. When it's ready, open **SQL Editor → New query**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. This creates the tables, security rules and the sign-up trigger.
3. **Authentication → Sign In / Providers → Email**: for a smooth demo, turn **Confirm email** off (students go straight to the dashboard after signing up). Leave it on for a real deployment — the app handles both.
4. **Authentication → URL Configuration**: set **Site URL** to your Vercel URL (e.g. `https://studymate.vercel.app`) and add `https://studymate.vercel.app/**` and `http://localhost:3000/**` under **Redirect URLs**. This makes email-confirmation and password-reset links work.
5. **Project Settings → API**: copy the **Project URL** and the **anon / publishable key**.

## 3. Run locally

```bash
npm install
cp .env.example .env.local   # paste your two Supabase values
npm run dev                  # http://localhost:3000
```

## 4. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and **Import** this GitHub repository (framework is detected as Next.js).
2. Under **Environment Variables** add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Click **Deploy**. Every push to `main` redeploys automatically.
4. Copy the live URL back into Supabase step 4 above.

---

## 5. How it works (walkthrough)

### Folder structure

```
src/
  app/
    page.tsx                 Landing page
    (auth)/                  Sign up, log in, forgot & reset password (shared split layout)
    auth/callback/route.ts   Exchanges email links for a session
    (app)/                   Signed-in area — layout loads the user and wraps pages in the sidebar shell
      dashboard/ planner/ notes/ subjects/ settings/
  components/
    ui/                      Design system: Button, Input, PasswordInput, Select, Textarea,
                             Segmented, Card, Badge, Modal, ConfirmDialog, Toast, Alert,
                             EmptyState, ErrorState, Skeleton, Logo
    app/                     Feature components: AppShell (sidebar), SessionForm, SubjectForm,
                             NoteEditor, SessionRow, WeeklyChart
  lib/
    supabase/                Browser, server and middleware Supabase clients
    db.ts                    All database reads/writes + TypeScript types
    use-query.ts             Shared loading / error / retry hook
    validation.ts date.ts colors.ts utils.ts
  middleware.ts              Protects app routes; refreshes the session cookie
supabase/schema.sql          Database schema + Row Level Security
```

### Database design

```
auth.users (managed by Supabase)
   │ 1–1
profiles        id, full_name, email, university, programme, year_of_study
   │ 1–many (user_id)
subjects        id, name, code, color
   │ 1–many (subject_id, ON DELETE SET NULL)
   ├── study_sessions   title, scheduled_at, duration_minutes, priority, status, completed_at
   └── notes            title, content, updated_at
```

- **Row Level Security** is on for every table: a policy `auth.uid() = user_id` means a student can only ever read or change their own rows — enforced by the database, not just the UI.
- A trigger (`handle_new_user`) creates the `profiles` row automatically when someone signs up, copying the full name from the sign-up form.
- Deleting a subject keeps its notes and sessions (they become "No subject") instead of silently destroying work.
- `updated_at` is maintained by a trigger, which powers "Updated 2 h ago" on notes.

### Authentication flow

1. Sign-up calls `supabase.auth.signUp` with the full name as metadata → trigger creates the profile.
2. The session is stored in a cookie by `@supabase/ssr`, so both server and browser know who's logged in.
3. `middleware.ts` runs on every request: signed-out users are sent from `/dashboard` etc. to `/login?next=…`; signed-in users are sent from `/login` to `/dashboard`.
4. Password reset emails link to `/auth/callback?next=/reset-password`, which swaps the code for a session, then the student sets a new password.

### Design system

- **Colour:** one brand colour (indigo `#4F46E5`) for primary actions, focus and active nav; slate neutrals; semantic emerald (success/completed), amber (medium), rose (high priority/danger). Eight subject colours in `lib/colors.ts`.
- **Type:** Geist Sans; page titles `text-2xl semibold`, card titles `text-base semibold`, body `text-sm`.
- **Shape:** `rounded-xl` cards, `rounded-lg` controls, 1px slate-200 borders, soft shadows.
- **Responsive:** fixed sidebar on desktop (≥1024px); top bar with slide-out drawer on tablet/mobile; grids collapse 4 → 2 → 1 columns; modals become bottom sheets on mobile.
- **Accessibility:** every input has a visible label (or `sr-only` label for search), errors linked with `aria-describedby`, `role="alert"` on errors, visible focus ring, skip-to-content link, keyboard-trapped modals that close on Escape, `aria-current` in nav, the chart has a screen-reader data table, `prefers-reduced-motion` respected.

### Demo script (prototype flow)

Landing → **Get started** → Sign up → Dashboard (getting-started checklist) → **Create your first subject** (or *Add sample subjects*) → **Schedule a study session** → **Write your first note** → tick the session as complete in the Planner → see Completed / Study hours / weekly chart update on the Dashboard → Settings → **Log out**.
