-- ============================================================================
-- AutoOnderhoud SaaS — Initial database schema
-- ============================================================================
-- Target: Supabase (Postgres 15+)
-- Design goals:
--   1. Every table user-data-owning is scoped to auth.uid() via RLS.
--   2. Soft-delete on cars (never hard-delete — history/reports depend on it).
--   3. Money stored in cents (int) to avoid float rounding issues.
--   4. Everything that can have >1 photo/attachment gets its own table
--      (car_photos, maintenance_attachments) instead of a single url column —
--      this is the #1 thing people regret not doing from day 1.
--   5. RDW data cached as jsonb on cars so we don't re-hit the API and keep
--      every field RDW gives us, even ones we don't have a column for yet.
--   6. Subscription/tier limits modeled now, enforced later — no schema
--      changes needed when Stripe goes live.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type car_brandstof as enum ('benzine', 'diesel', 'elektrisch', 'hybride', 'lpg', 'waterstof', 'overig');
create type car_status as enum ('actief', 'verkocht', 'verwijderd');
create type mileage_bron as enum ('handmatig', 'garage', 'apk', 'schatting');
create type maintenance_categorie as enum ('motor', 'banden', 'remmen', 'vloeistoffen', 'filters', 'apk', 'carrosserie', 'elektrisch', 'overig');
create type uitgevoerd_door as enum ('zelf', 'garage', 'dealer', 'onbekend');
create type schedule_status as enum ('ok', 'binnenkort', 'verlopen', 'onbekend');
create type notification_type as enum ('apk_verloopt', 'onderhoud_nodig', 'onderhoud_overdue', 'systeem', 'garage_koppeling');
create type notification_kanaal as enum ('email', 'in_app', 'sms', 'push');
create type report_type as enum ('onderhoud_historie', 'kosten_overzicht', 'verkoop_rapport');
create type garage_link_status as enum ('pending', 'actief', 'geweigerd', 'verwijderd');
create type subscription_status as enum ('trialing', 'actief', 'verlopen', 'opgezegd', 'geen');

-- ----------------------------------------------------------------------------
-- Helper: updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- 1. PROFILES — extends auth.users (1:1)
-- ============================================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- auto-create profile row when someone signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  insert into public.notification_preferences (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- 2. SUBSCRIPTIONS & TIERS (monetisatie — vanaf dag 1 in het model)
-- ============================================================================
create table subscription_tiers (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,               -- 'free' | 'premium' | 'business'
  naam text not null,
  max_autos int,                          -- null = onbeperkt
  heeft_rapporten boolean not null default false,
  heeft_kosten_dashboard boolean not null default false,
  heeft_garage_koppeling boolean not null default false,
  prijs_maand_cents int,                  -- null = niet van toepassing (free)
  prijs_jaar_cents int,
  sort_order int not null default 0
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  tier_id uuid not null references subscription_tiers(id),
  status subscription_status not null default 'geen',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_updated_at before update on subscriptions
  for each row execute function set_updated_at();

-- ============================================================================
-- 3. NOTIFICATION PREFERENCES (1:1 met user)
-- ============================================================================
create table notification_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  email_enabled boolean not null default true,
  push_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  dagen_vooraf int[] not null default '{30,14,7,1}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_updated_at before update on notification_preferences
  for each row execute function set_updated_at();

-- ============================================================================
-- 4. GARAGES (fase 2, maar tabellen nu al klaar)
-- ============================================================================
create table garages (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  kvk_nummer text,
  adres text,
  postcode text,
  plaats text,
  telefoon text,
  email text,
  website text,
  is_geverifieerd boolean not null default false,
  owner_user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger garages_updated_at before update on garages
  for each row execute function set_updated_at();

create table garage_reviews (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references garages(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  review_tekst text,
  created_at timestamptz not null default now(),
  unique (garage_id, user_id)
);

-- ============================================================================
-- 5. CARS — de kern
-- ============================================================================
create table cars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kenteken text not null,
  bijnaam text,
  merk text,
  model text,
  bouwjaar int,
  kleur text,
  brandstof car_brandstof,
  carrosserie text,
  apk_vervaldatum date,
  eerste_toelating date,
  cilinderinhoud int,
  gewicht int,
  huidige_km int not null default 0,
  rdw_data jsonb not null default '{}'::jsonb,   -- volledige raw RDW response, cached
  rdw_last_synced_at timestamptz,
  status car_status not null default 'actief',   -- soft delete via 'verwijderd'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kenteken)
);

create index cars_user_id_idx on cars(user_id) where status = 'actief';
create index cars_apk_vervaldatum_idx on cars(apk_vervaldatum) where status = 'actief';

create trigger cars_updated_at before update on cars
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 5b. CAR PHOTOS — meerdere foto's per auto, één primary
-- ----------------------------------------------------------------------------
create table car_photos (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references cars(id) on delete cascade,
  storage_path text not null,   -- pad in supabase storage bucket 'car-photos'
  is_primary boolean not null default false,
  sort_order int not null default 0,
  uploaded_at timestamptz not null default now()
);

create index car_photos_car_id_idx on car_photos(car_id);

-- ----------------------------------------------------------------------------
-- 5c. MILEAGE LOGS — kilometerstand-historie (nodig voor onderhoudsberekening)
-- ----------------------------------------------------------------------------
create table mileage_logs (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references cars(id) on delete cascade,
  km_stand int not null,
  datum date not null default current_date,
  bron mileage_bron not null default 'handmatig',
  notitie text,
  created_at timestamptz not null default now()
);

create index mileage_logs_car_id_idx on mileage_logs(car_id, datum desc);

-- ============================================================================
-- 6. MAINTENANCE — types, records, schedule, attachments
-- ============================================================================
create table maintenance_types (
  id uuid primary key default gen_random_uuid(),
  key text unique,                        -- null voor custom user-types
  naam text not null,
  categorie maintenance_categorie not null default 'overig',
  icon text,
  default_interval_km int,
  default_interval_maanden int,
  is_systeem boolean not null default true,   -- false = door user aangemaakt
  user_id uuid references profiles(id) on delete cascade, -- alleen bij custom
  created_at timestamptz not null default now()
);

create table maintenance_records (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references cars(id) on delete cascade,
  maintenance_type_id uuid not null references maintenance_types(id),
  uitgevoerd_op date not null default current_date,
  km_stand_bij_uitvoering int,
  kosten_cents int,
  valuta text not null default 'EUR',
  notities text,
  uitgevoerd_door uitgevoerd_door not null default 'onbekend',
  garage_id uuid references garages(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index maintenance_records_car_id_idx on maintenance_records(car_id, uitgevoerd_op desc);

create trigger maintenance_records_updated_at before update on maintenance_records
  for each row execute function set_updated_at();

create table maintenance_attachments (
  id uuid primary key default gen_random_uuid(),
  maintenance_record_id uuid not null references maintenance_records(id) on delete cascade,
  storage_path text not null,   -- pad in bucket 'maintenance-attachments'
  bestandstype text,            -- 'foto' | 'pdf' | ...
  uploaded_at timestamptz not null default now()
);

create index maintenance_attachments_record_idx on maintenance_attachments(maintenance_record_id);

-- ----------------------------------------------------------------------------
-- 6b. MAINTENANCE SCHEDULE — "wat moet wanneer" per auto per type
-- (status wordt herberekend door een scheduled function/cron, niet live query)
-- ----------------------------------------------------------------------------
create table maintenance_schedule (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references cars(id) on delete cascade,
  maintenance_type_id uuid not null references maintenance_types(id),
  laatste_record_id uuid references maintenance_records(id) on delete set null,
  volgende_datum date,
  volgende_km int,
  status schedule_status not null default 'onbekend',
  updated_at timestamptz not null default now(),
  unique (car_id, maintenance_type_id)
);

create index maintenance_schedule_status_idx on maintenance_schedule(status);

create trigger maintenance_schedule_updated_at before update on maintenance_schedule
  for each row execute function set_updated_at();

-- ============================================================================
-- 7. GARAGE ↔ CAR koppeling (fase 2)
-- ============================================================================
create table garage_car_links (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references garages(id) on delete cascade,
  car_id uuid not null references cars(id) on delete cascade,
  status garage_link_status not null default 'pending',
  gekoppeld_op timestamptz not null default now(),
  unique (garage_id, car_id)
);

-- ============================================================================
-- 8. NOTIFICATIONS
-- ============================================================================
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  car_id uuid references cars(id) on delete cascade,
  type notification_type not null,
  kanaal notification_kanaal not null default 'in_app',
  titel text not null,
  bericht text not null,
  gelezen boolean not null default false,
  gelezen_op timestamptz,
  verzonden_op timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on notifications(user_id, gelezen, created_at desc);

-- ============================================================================
-- 9. REPORTS (premium sellable feature)
-- ============================================================================
create table reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  car_id uuid references cars(id) on delete cascade,  -- null = alle auto's
  type report_type not null,
  periode_start date,
  periode_eind date,
  storage_path text,   -- pad in bucket 'reports', null zolang nog genereren
  gegenereerd_op timestamptz,
  created_at timestamptz not null default now()
);

create index reports_user_id_idx on reports(user_id, created_at desc);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table notification_preferences enable row level security;
alter table cars enable row level security;
alter table car_photos enable row level security;
alter table mileage_logs enable row level security;
alter table maintenance_records enable row level security;
alter table maintenance_attachments enable row level security;
alter table maintenance_schedule enable row level security;
alter table notifications enable row level security;
alter table reports enable row level security;
alter table garage_car_links enable row level security;
alter table garage_reviews enable row level security;
alter table maintenance_types enable row level security;
-- garages, subscription_tiers: publiek leesbaar, geen RLS op select nodig (wel op write)
alter table garages enable row level security;
alter table subscription_tiers enable row level security;

-- profiles
create policy "profiles: select own" on profiles for select using (auth.uid() = id);
create policy "profiles: update own" on profiles for update using (auth.uid() = id);

-- subscriptions
create policy "subscriptions: select own" on subscriptions for select using (auth.uid() = user_id);

-- notification_preferences
create policy "notif_prefs: all own" on notification_preferences for all using (auth.uid() = user_id);

-- cars
create policy "cars: all own" on cars for all using (auth.uid() = user_id);

-- car_photos (via car ownership)
create policy "car_photos: all via car" on car_photos for all using (
  exists (select 1 from cars where cars.id = car_photos.car_id and cars.user_id = auth.uid())
);

-- mileage_logs
create policy "mileage_logs: all via car" on mileage_logs for all using (
  exists (select 1 from cars where cars.id = mileage_logs.car_id and cars.user_id = auth.uid())
);

-- maintenance_records
create policy "maintenance_records: all via car" on maintenance_records for all using (
  exists (select 1 from cars where cars.id = maintenance_records.car_id and cars.user_id = auth.uid())
);

-- maintenance_attachments (via record → car)
create policy "maintenance_attachments: all via record" on maintenance_attachments for all using (
  exists (
    select 1 from maintenance_records mr
    join cars c on c.id = mr.car_id
    where mr.id = maintenance_attachments.maintenance_record_id and c.user_id = auth.uid()
  )
);

-- maintenance_schedule
create policy "maintenance_schedule: select via car" on maintenance_schedule for select using (
  exists (select 1 from cars where cars.id = maintenance_schedule.car_id and cars.user_id = auth.uid())
);

-- maintenance_types: systeem-types voor iedereen leesbaar, custom alleen eigenaar
create policy "maintenance_types: select systeem of eigen" on maintenance_types for select using (
  is_systeem = true or user_id = auth.uid()
);
create policy "maintenance_types: insert eigen" on maintenance_types for insert with check (
  user_id = auth.uid() and is_systeem = false
);

-- notifications
create policy "notifications: all own" on notifications for all using (auth.uid() = user_id);

-- reports
create policy "reports: all own" on reports for all using (auth.uid() = user_id);

-- garages: publiek leesbaar, alleen owner mag wijzigen
create policy "garages: select all" on garages for select using (true);
create policy "garages: update own" on garages for update using (auth.uid() = owner_user_id);

-- garage_car_links: zichtbaar voor auto-eigenaar of garage-owner
create policy "garage_car_links: select betrokkenen" on garage_car_links for select using (
  exists (select 1 from cars where cars.id = garage_car_links.car_id and cars.user_id = auth.uid())
  or exists (select 1 from garages where garages.id = garage_car_links.garage_id and garages.owner_user_id = auth.uid())
);

-- garage_reviews: iedereen leest, alleen eigen review schrijven/wijzigen
create policy "garage_reviews: select all" on garage_reviews for select using (true);
create policy "garage_reviews: insert own" on garage_reviews for insert with check (auth.uid() = user_id);
create policy "garage_reviews: update own" on garage_reviews for update using (auth.uid() = user_id);

-- subscription_tiers: publiek leesbaar (pricing page), geen writes via client
create policy "subscription_tiers: select all" on subscription_tiers for select using (true);

-- ============================================================================
-- SEED DATA
-- ============================================================================
insert into subscription_tiers (key, naam, max_autos, heeft_rapporten, heeft_kosten_dashboard, heeft_garage_koppeling, prijs_maand_cents, prijs_jaar_cents, sort_order) values
  ('free', 'Gratis', 1, false, false, false, null, null, 0),
  ('premium', 'Premium', null, true, true, true, 499, 4990, 1),
  ('business', 'Business', null, true, true, true, 1999, 19990, 2);

insert into maintenance_types (key, naam, categorie, default_interval_km, default_interval_maanden, is_systeem) values
  ('apk', 'APK-keuring', 'apk', null, 12, true),
  ('olie_filter', 'Olie + oliefilter verversen', 'vloeistoffen', 15000, 12, true),
  ('banden_wisselen', 'Banden wisselen (zomer/winter)', 'banden', null, 6, true),
  ('bandenprofiel_check', 'Bandenprofiel controle', 'banden', 10000, 6, true),
  ('remvloeistof', 'Remvloeistof verversen', 'vloeistoffen', null, 24, true),
  ('remblokken', 'Remblokken/remschijven controle', 'remmen', 20000, 12, true),
  ('distributieriem', 'Distributieriem vervangen', 'motor', 90000, 60, true),
  ('accu_check', 'Accu conditie check', 'elektrisch', null, 12, true),
  ('luchtfilter', 'Luchtfilter vervangen', 'filters', 30000, 24, true),
  ('interieurfilter', 'Interieur-/pollenfilter vervangen', 'filters', 20000, 12, true),
  ('koelvloeistof', 'Koelvloeistof controleren/verversen', 'vloeistoffen', null, 24, true),
  ('ruitenwissers', 'Ruitenwissers vervangen', 'carrosserie', null, 12, true);
