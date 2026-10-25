-- Multi-tenant foundation (P0): one deployment serves many clinics.
-- Clinic config and UltraMsg credentials move from env vars into the DB.
-- Paste into the Supabase SQL editor after 0003_revenue.sql, then run the backfill block at the bottom.

alter table clinics
  add column slug text unique,                              -- public id for the web widget (P1)
  add column branding jsonb not null default '{}',          -- logo, colors, widget greeting (P1/P3)
  add column persona jsonb not null default '{}',           -- {"name":"Sara"}; empty = "Sara"
  add column allowed_origins text[] not null default '{}',  -- sites allowed to embed the widget (P1)
  add column staff_whatsapp text,                           -- handoff alerts; null = no pause on handoff
  add column ultramsg_instance_id text unique,              -- digits only, without the "instance" prefix
  add column active boolean not null default true;

-- Service role only (RLS on, no policies): the dashboard never reads these.
create table clinic_secrets (
  clinic_id uuid primary key references clinics on delete cascade,
  ultramsg_token text not null,
  webhook_secret text not null
);
alter table clinic_secrets enable row level security;

-- Debounce, rate limit and follow-ups count per clinic: one phone can talk to two clinics.
alter table processed_messages add column clinic_id uuid references clinics on delete cascade;
create index on processed_messages (clinic_id, patient_wa, seq);

-- Web chat visitors (P1): a patient is a WhatsApp chat or an anonymous browser id. Phone is asked before a web booking.
alter table patients
  alter column wa_id drop not null,
  add column web_visitor_id uuid,
  add column phone text,
  add constraint patients_clinic_web_visitor_key unique (clinic_id, web_visitor_id),
  add constraint patients_identity check (wa_id is not null or web_visitor_id is not null);

-- Readable transcript for the staff inbox. conversations.history stays the agent's memory.
create table messages (
  id bigint generated always as identity primary key,
  clinic_id uuid not null references clinics on delete cascade,
  patient_id uuid not null references patients on delete cascade,
  channel text not null check (channel in ('whatsapp', 'web')),
  role text not null check (role in ('patient', 'assistant', 'staff', 'system')),
  body text not null,
  created_at timestamptz not null default now()
);
create index on messages (clinic_id, created_at desc);
create index on messages (patient_id, created_at);
alter table messages enable row level security;

-- Model usage per clinic, for cost tracking and pricing.
create table usage_events (
  id bigint generated always as identity primary key,
  clinic_id uuid not null references clinics on delete cascade,
  channel text not null check (channel in ('whatsapp', 'web')),
  requests int not null,
  input_tokens int not null,
  output_tokens int not null,
  created_at timestamptz not null default now()
);
create index on usage_events (clinic_id, created_at);
alter table usage_events enable row level security;

-- Backfill the sample clinic (run once, by hand). Replace the <PLACEHOLDERS> with the values from .env.local.
-- Keep the real values out of git.
-- update clinics set
--   slug = 'sample-smile',
--   persona = '{"name":"Sara"}',
--   ultramsg_instance_id = '<ULTRAMSG_INSTANCE_ID digits only, no "instance" prefix>',
--   staff_whatsapp = '<STAFF_WHATSAPP, e.g. 971500000000@c.us, or remove this line>'
-- where id = '00000000-0000-0000-0000-000000000001';
-- insert into clinic_secrets (clinic_id, ultramsg_token, webhook_secret)
-- values ('00000000-0000-0000-0000-000000000001', '<ULTRAMSG_TOKEN>', '<WEBHOOK_SECRET>');
-- update processed_messages set clinic_id = '00000000-0000-0000-0000-000000000001' where clinic_id is null;
