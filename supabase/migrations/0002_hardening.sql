-- Hardening: message pieces live in the DB (debounce works across Vercel instances) and feed a per-sender rate limit.
-- Paste into the Supabase SQL editor after 0001_init.sql.

alter table processed_messages
  add column seq bigint generated always as identity, -- arrival order; "newest piece" check
  add column patient_wa text,                         -- UltraMsg chat id of the sender
  add column body text,                               -- the piece as text (voice notes transcribed); null = not for the model
  add column answered boolean not null default false;

create index on processed_messages (patient_wa, seq);
create index on processed_messages (patient_wa, created_at);

-- Old pieces are only needed for dedupe of webhook retries (minutes) and the 10-minute rate window.
-- Optional: enable pg_cron (Database > Extensions) first, then run this once.
-- select cron.schedule('prune-processed-messages', '0 3 * * *', $$delete from processed_messages where created_at < now() - interval '14 days'$$);
