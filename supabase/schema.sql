-- =====================================================================
-- StudyMate database schema
-- Run this once in Supabase: Dashboard → SQL Editor → New query → Run.
-- Safe to re-run: it drops and recreates policies/triggers it owns.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- One profile per student, created automatically on sign-up (see trigger).
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null default '',
  email         text,
  university    text,
  programme     text,
  year_of_study text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.subjects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(trim(name)) between 1 and 80),
  code       text check (code is null or char_length(code) <= 20),
  color      text not null default 'indigo',
  created_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id       uuid references public.subjects (id) on delete set null,
  title            text not null check (char_length(trim(title)) between 1 and 120),
  scheduled_at     timestamptz not null,
  duration_minutes integer not null check (duration_minutes between 5 and 600),
  priority         text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status           text not null default 'pending' check (status in ('pending', 'completed')),
  description      text,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title      text not null check (char_length(trim(title)) between 1 and 150),
  content    text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subjects_user_idx        on public.subjects (user_id);
create index if not exists sessions_user_time_idx   on public.study_sessions (user_id, scheduled_at);
create index if not exists sessions_subject_idx     on public.study_sessions (subject_id);
create index if not exists notes_user_updated_idx   on public.notes (user_id, updated_at desc);
create index if not exists notes_subject_idx        on public.notes (subject_id);

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists sessions_updated_at on public.study_sessions;
create trigger sessions_updated_at before update on public.study_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists notes_updated_at on public.notes;
create trigger notes_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Create a profile row whenever a student signs up
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Row Level Security: every student can only see and change their own data
-- ---------------------------------------------------------------------

alter table public.profiles       enable row level security;
alter table public.subjects       enable row level security;
alter table public.study_sessions enable row level security;
alter table public.notes          enable row level security;

-- Profiles
drop policy if exists "Own profile: read"   on public.profiles;
drop policy if exists "Own profile: update" on public.profiles;
create policy "Own profile: read"   on public.profiles for select using (auth.uid() = id);
create policy "Own profile: update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Subjects
drop policy if exists "Own subjects" on public.subjects;
create policy "Own subjects" on public.subjects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Study sessions (a session may only point at one of the student's own subjects)
drop policy if exists "Own sessions" on public.study_sessions;
create policy "Own sessions" on public.study_sessions for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (subject_id is null or exists (
      select 1 from public.subjects s where s.id = subject_id and s.user_id = auth.uid()
    ))
  );

-- Notes (same subject ownership rule)
drop policy if exists "Own notes" on public.notes;
create policy "Own notes" on public.notes for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (subject_id is null or exists (
      select 1 from public.subjects s where s.id = subject_id and s.user_id = auth.uid()
    ))
  );

-- Backfill profiles for any users created before this script ran
insert into public.profiles (id, full_name, email)
select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', ''), u.email
from auth.users u
on conflict (id) do nothing;
