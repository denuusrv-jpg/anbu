-- DSpora: Datenbank-Schema für Supabase.
-- Einmalig im Supabase-Dashboard unter "SQL Editor" -> "New query" einfügen und ausführen.
-- Das Skript ist wiederholbar: bereits vorhandene Teile werden übersprungen bzw. ersetzt.

-- ─────────────────────────────────────────────────────────────
-- 1) Warteliste (nur der Server schreibt/liest, über den Service-Role-Key)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  token      uuid not null unique default gen_random_uuid(),
  status     text not null default 'pending' check (status in ('pending', 'onboarded')),
  created_at timestamptz not null default now()
);

-- Eine E-Mail darf nur einmal vorkommen (Groß-/Kleinschreibung egal)
create unique index if not exists waitlist_email_unique on public.waitlist (lower(email));

-- RLS an, aber bewusst KEINE Policies: Browser-Nutzer kommen nie direkt an diese Tabelle.
alter table public.waitlist enable row level security;

-- ─────────────────────────────────────────────────────────────
-- 2) Nutzerprofile (Ergebnis des Onboarding-Chats)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.user_profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  region     text not null,
  city       text,
  interests  jsonb not null default '{"ids":[],"custom":[]}'::jsonb,
  vibes      jsonb not null default '{"ids":[],"custom":[]}'::jsonb,
  mode       text not null default 'anonymous' check (mode in ('anonymous', 'profile')),
  profile    jsonb,            -- Anzeigename, Alter, Bio, Hobbys, Sprachen, Sichtbarkeit, Fotoanzahl …
  extras     jsonb,            -- Antworten der Bonus-Fragen
  status     text not null default 'preparing' check (status in ('preparing', 'matched')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

-- Jeder Nutzer sieht und ändert ausschließlich sein eigenes Profil.
drop policy if exists "Eigenes Profil lesen" on public.user_profiles;
create policy "Eigenes Profil lesen" on public.user_profiles
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Eigenes Profil anlegen" on public.user_profiles;
create policy "Eigenes Profil anlegen" on public.user_profiles
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Eigenes Profil ändern" on public.user_profiles;
create policy "Eigenes Profil ändern" on public.user_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Eigenes Profil löschen" on public.user_profiles;
create policy "Eigenes Profil löschen" on public.user_profiles
  for delete to authenticated using (auth.uid() = user_id);

-- updated_at automatisch pflegen
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_profiles_updated_at on public.user_profiles;
create trigger user_profiles_updated_at before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 3) Profilfotos (privater Speicher, jeder Nutzer nur in seinem eigenen Ordner)
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 3145728, array['image/jpeg'])
on conflict (id) do nothing;

drop policy if exists "Eigene Fotos lesen" on storage.objects;
create policy "Eigene Fotos lesen" on storage.objects
  for select to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Eigene Fotos hochladen" on storage.objects;
create policy "Eigene Fotos hochladen" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Eigene Fotos ersetzen" on storage.objects;
create policy "Eigene Fotos ersetzen" on storage.objects
  for update to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Eigene Fotos löschen" on storage.objects;
create policy "Eigene Fotos löschen" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─────────────────────────────────────────────────────────────
-- 4) Entwürfe: Antworten aus dem Chat, bevor die Anmeldung per Link bestätigt ist
--    (damit der Link auch auf einem anderen Gerät funktioniert). Nur der Server liest/schreibt.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.onboarding_drafts (
  email      text primary key,                -- immer kleingeschrieben
  answers    jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.onboarding_drafts enable row level security;
-- bewusst KEINE Policies: Browser-Nutzer haben hier keinen Zugriff.

-- ─────────────────────────────────────────────────────────────
-- 5) Soft-Delete (DSGVO): gelöschte Accounts bleiben 30 Tage sichtbar für den Support,
--    danach löscht ein täglicher Job sie endgültig ("Recht auf Vergessenwerden").
-- ─────────────────────────────────────────────────────────────
alter table public.user_profiles add column if not exists deleted_at timestamptz;
create index if not exists user_profiles_deleted_at_idx
  on public.user_profiles (deleted_at) where deleted_at is not null;

-- ─────────────────────────────────────────────────────────────
-- 6) Wünsche & Ideen für DSpora (Co-Creation)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.user_wishes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  wish       text not null check (char_length(wish) between 3 and 1500),
  created_at timestamptz not null default now()
);

create index if not exists user_wishes_created_at_idx on public.user_wishes (created_at desc);

alter table public.user_wishes enable row level security;

drop policy if exists "Eigene Wünsche lesen" on public.user_wishes;
create policy "Eigene Wünsche lesen" on public.user_wishes
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Eigene Wünsche anlegen" on public.user_wishes;
create policy "Eigene Wünsche anlegen" on public.user_wishes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Eigene Wünsche löschen" on public.user_wishes;
create policy "Eigene Wünsche löschen" on public.user_wishes
  for delete to authenticated using (auth.uid() = user_id);
