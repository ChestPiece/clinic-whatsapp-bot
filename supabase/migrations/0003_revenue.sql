-- Revenue features: reminders + confirm (R2), and the columns R3/R4 and the weekly report read.
-- Paste into the Supabase SQL editor after 0002_hardening.sql.

alter table appointments
  add column confirmed_at timestamptz,                -- patient replied 1/yes to a reminder
  add column source text not null default 'chat'
    check (source in ('chat', 'followup', 'waitlist', 'recall')); -- which feature won the booking (weekly report)
alter table appointments drop constraint appointments_status_check;
alter table appointments add constraint appointments_status_check
  check (status in ('booked', 'cancelled', 'completed', 'no_show'));

alter table patients
  add column opted_out boolean not null default false, -- sent STOP: no follow-up, recall or waitlist messages
  add column recall_due date,
  add column recall_sent_at timestamptz;

alter table conversations
  add column followup_sent_at timestamptz;

-- Reminder scan: booked visits by start time.
create index on appointments (clinic_id, starts_at) where status = 'booked';

-- Schedule (run once, by hand, after enabling the pg_cron and pg_net extensions under Database > Extensions).
-- Replace <CRON_SECRET> with the value from .env.local. Keep the secret out of git.
-- select cron.schedule('clinic-jobs', '*/15 * * * *', $$
--   select net.http_post(
--     url := 'https://sara-clinic-bot.vercel.app/api/cron?secret=<CRON_SECRET>',
--     headers := '{"Content-Type": "application/json"}'::jsonb,
--     body := '{}'::jsonb
--   )
-- $$);
