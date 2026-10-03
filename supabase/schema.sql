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

-- ─────────────────────────────────────────────────────────────
-- 7) Business-Modus, Light-CV und Sichtbarkeit
-- ─────────────────────────────────────────────────────────────
alter table public.user_profiles add column if not exists track text not null default 'community';
alter table public.user_profiles add column if not exists business jsonb;       -- Branche, Rolle, Ziele, Light-CV
alter table public.user_profiles add column if not exists visibility text not null default 'stealth';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_profiles_track_check') then
    alter table public.user_profiles
      add constraint user_profiles_track_check check (track in ('community', 'business'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_profiles_visibility_check') then
    alter table public.user_profiles
      add constraint user_profiles_visibility_check check (visibility in ('public', 'business', 'stealth'));
  end if;
  -- "Nur für Business-Profile sichtbar" gibt es nur für Business-Profile selbst
  if not exists (select 1 from pg_constraint where conname = 'user_profiles_visibility_business_check') then
    alter table public.user_profiles
      add constraint user_profiles_visibility_business_check check (visibility <> 'business' or track = 'business');
  end if;
  -- Business-Profile sind immer Profile mit Namen (nicht anonym)
  if not exists (select 1 from pg_constraint where conname = 'user_profiles_business_mode_check') then
    alter table public.user_profiles
      add constraint user_profiles_business_mode_check check (track <> 'business' or mode = 'profile');
  end if;
end
$$;

-- Gegenseitige Matches (später von der Matching-Engine geschrieben, nur der Server schreibt)
create table if not exists public.matches (
  user_a     uuid not null references auth.users (id) on delete cascade,
  user_b     uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a <> user_b)
);

alter table public.matches enable row level security;

drop policy if exists "Eigene Matches lesen" on public.matches;
create policy "Eigene Matches lesen" on public.matches
  for select to authenticated using (auth.uid() in (user_a, user_b));

-- Setzt die Sichtbarkeit in der Datenbank durch: Wer darf wessen Profil sehen?
--   public   -> alle angemeldeten Nutzer
--   business -> nur Nutzer mit Business-Profil
--   stealth  -> nur bei gegenseitigem Match
-- Anonyme Profile zeigen weder Namen noch Stadt noch Business-Angaben.
create or replace function public.discoverable_profiles()
returns table (
  user_id      uuid,
  display_name text,
  region       text,
  city         text,
  interests    jsonb,
  vibes        jsonb,
  track        text,
  business     jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.user_id,
    case when p.mode = 'profile' then p.profile ->> 'displayName' end,
    p.region,
    case when p.mode = 'profile' then p.city end,
    p.interests,
    p.vibes,
    p.track,
    case when p.mode = 'profile' then p.business end
  from public.user_profiles p
  where auth.uid() is not null
    and p.deleted_at is null
    and p.user_id <> auth.uid()
    and (
      p.visibility = 'public'
      or (
        p.visibility = 'business'
        and exists (
          select 1 from public.user_profiles me
          where me.user_id = auth.uid() and me.track = 'business' and me.deleted_at is null
        )
      )
      or (
        p.visibility = 'stealth'
        and exists (
          select 1 from public.matches m
          where (m.user_a = auth.uid() and m.user_b = p.user_id)
             or (m.user_b = auth.uid() and m.user_a = p.user_id)
        )
      )
    );
$$;

revoke all on function public.discoverable_profiles() from public, anon;
grant execute on function public.discoverable_profiles() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 8) Gewünschte Gruppengröße (Duo / Crew / Squad)
-- ─────────────────────────────────────────────────────────────
alter table public.user_profiles add column if not exists group_size text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_profiles_group_size_check') then
    alter table public.user_profiles
      add constraint user_profiles_group_size_check check (group_size is null or group_size in ('duo', 'crew', 'squad'));
  end if;
end
$$;

-- ─────────────────────────────────────────────────────────────
-- 9) Zweiter Hub (höchstens zwei Hubs pro Person)
-- ─────────────────────────────────────────────────────────────
alter table public.user_profiles add column if not exists second_region text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_profiles_second_region_check') then
    alter table public.user_profiles
      add constraint user_profiles_second_region_check check (second_region is null or second_region <> region);
  end if;
end
$$;

-- ─────────────────────────────────────────────────────────────
-- 10) Geschlecht (Selbstangabe) und Wunsch, mit wem man sich verbinden möchte
--     gender: Id (female, male, nonbinary, na) oder eigener Text; match_gender: any, female, male
-- ─────────────────────────────────────────────────────────────
alter table public.user_profiles add column if not exists gender text;
alter table public.user_profiles add column if not exists match_gender text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_profiles_match_gender_check') then
    alter table public.user_profiles
      add constraint user_profiles_match_gender_check check (match_gender is null or match_gender in ('any', 'female', 'male'));
  end if;
end
$$;

-- ─────────────────────────────────────────────────────────────
-- 11) Chatverlauf pro Konto. Für Nutzer nicht sichtbar: keine Policy, nur der Server (Service Role)
--     schreibt und liest. Der Verlauf dient dem Steckbrief und dem Fortsetzen des Gesprächs.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null check (role in ('bot', 'user')),
  text       text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_idx on public.chat_messages (user_id, created_at);
alter table public.chat_messages enable row level security;

-- Gäste: der Verlauf reist mit dem Entwurf, bis die Anmeldung per Link bestätigt ist
alter table public.onboarding_drafts add column if not exists transcript jsonb;

-- ─────────────────────────────────────────────────────────────
-- 12) System-Fehler (Fehler-Tracking). Gleiche Fehler werden zusammengefasst:
--     fingerprint = Hash aus bereinigter Meldung + Ort. Nur der Server (Service Role) liest und schreibt.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.system_errors (
  id                uuid primary key default gen_random_uuid(),
  fingerprint       text not null unique,
  error_message     text not null,
  component_path    text not null default 'unbekannt',
  occurrences_count integer not null default 1,
  first_occurred_at timestamptz not null default now(),
  last_occurred_at  timestamptz not null default now(),
  stack_trace       text
);

create index if not exists system_errors_last_idx on public.system_errors (last_occurred_at desc);
alter table public.system_errors enable row level security;

-- Atomar zählen: neuer Fehler = neue Zeile, derselbe Fehler = Zähler +1 und neuer Zeitpunkt
create or replace function public.log_system_error(p_fingerprint text, p_message text, p_path text, p_stack text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.system_errors (fingerprint, error_message, component_path, stack_trace)
  values (p_fingerprint, p_message, p_path, p_stack)
  on conflict (fingerprint) do update
    set occurrences_count = public.system_errors.occurrences_count + 1,
        last_occurred_at = now();
end;
$$;

revoke all on function public.log_system_error(text, text, text, text) from public, anon, authenticated;
grant execute on function public.log_system_error(text, text, text, text) to service_role;
