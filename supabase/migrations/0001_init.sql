-- Clinic WhatsApp bot schema. Paste into the Supabase SQL editor, then run seed.sql.
-- The server talks to the DB with the service role only, so RLS is on with no policies (no anon access).

create extension if not exists btree_gist;

create table clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  utc_offset_minutes int not null default 240, -- UAE is UTC+4, no DST
  hours jsonb not null,     -- {"sat":[["09:00","13:00"],["16:00","21:00"]], "fri":[["16:00","21:00"]]}
  services jsonb not null,  -- [{"name":"Check-up","name_ar":"فحص","minutes":30,"price_aed":150}]
  insurers text[] not null default '{}',
  faq jsonb not null default '[]', -- [{"q":"...","a":"..."}]
  phone text,
  address text,
  maps_url text,
  created_at timestamptz not null default now()
);

create table patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics on delete cascade,
  wa_id text not null, -- UltraMsg chat id, e.g. 971501234567@c.us
  name text,
  created_at timestamptz not null default now(),
  unique (clinic_id, wa_id)
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics on delete cascade,
  patient_id uuid not null references patients on delete cascade,
  service text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  status text not null default 'booked' check (status in ('booked', 'cancelled')),
  reminded_24h_at timestamptz,
  reminded_2h_at timestamptz,
  created_at timestamptz not null default now(),
  -- No double booking. ponytail: one chair per clinic; add a dentist/chair column to this constraint for multi-chair clinics.
  exclude using gist (clinic_id with =, tstzrange(starts_at, ends_at) with &&) where (status = 'booked')
);
create index on appointments (patient_id, starts_at);

create table conversations (
  patient_id uuid primary key references patients on delete cascade,
  history jsonb not null default '[]', -- OpenAI Agents SDK input items
  bot_paused boolean not null default false, -- true after handoff; staff set it back to false
  updated_at timestamptz not null default now()
);

-- UltraMsg message ids already handled (webhook retries must not reply twice).
create table processed_messages (
  id text primary key,
  created_at timestamptz not null default now()
);

alter table clinics enable row level security;
alter table patients enable row level security;
alter table appointments enable row level security;
alter table conversations enable row level security;
alter table processed_messages enable row level security;
