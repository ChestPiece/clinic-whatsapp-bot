-- Staff dashboard (P2): Supabase Auth users see only the clinics they belong to.
--
-- Creating a staff user (no public sign-up):
--   1. Supabase dashboard > Authentication > Users > "Invite user" (or "Add user" with a password).
--   2. Copy the new user's id and link it to a clinic:
--        insert into memberships (user_id, clinic_id, role)
--        values ('<AUTH_USER_ID>', '<CLINIC_ID>', 'owner');   -- or 'staff'
--   Platform admins (Anas) see every clinic:
--        insert into platform_admins (user_id) values ('<AUTH_USER_ID>');
--
-- The service role (agent, webhooks, cron) bypasses RLS, so nothing here changes the bot.

create table memberships (
  user_id uuid not null references auth.users on delete cascade,
  clinic_id uuid not null references clinics on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  primary key (user_id, clinic_id)
);
create index on memberships (clinic_id);
alter table memberships enable row level security;

create table platform_admins (
  user_id uuid primary key references auth.users on delete cascade
);
alter table platform_admins enable row level security;

-- security definer: policies call this without needing their own policies on memberships.
create function is_member(clinic uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where user_id = auth.uid() and clinic_id = clinic)
      or exists (select 1 from platform_admins where user_id = auth.uid());
$$;
revoke execute on function is_member(uuid) from public, anon;
grant execute on function is_member(uuid) to authenticated;

-- Users may read their own memberships (clinic switcher).
create policy "own memberships" on memberships for select to authenticated using (user_id = auth.uid());

-- Read
create policy "members read clinics" on clinics for select to authenticated using (is_member(id));
create policy "members read patients" on patients for select to authenticated using (is_member(clinic_id));
create policy "members read appointments" on appointments for select to authenticated using (is_member(clinic_id));
create policy "members read messages" on messages for select to authenticated using (is_member(clinic_id));
create policy "members read conversations" on conversations for select to authenticated
  using (is_member((select clinic_id from patients where id = patient_id)));
-- clinic_secrets: no policy on purpose (service role only).

-- Update: RLS picks the rows, column grants pick the fields.
create policy "members update patients" on patients for update to authenticated
  using (is_member(clinic_id)) with check (is_member(clinic_id));
create policy "members update appointments" on appointments for update to authenticated
  using (is_member(clinic_id)) with check (is_member(clinic_id));
create policy "members update conversations" on conversations for update to authenticated
  using (is_member((select clinic_id from patients where id = patient_id)))
  with check (is_member((select clinic_id from patients where id = patient_id)));

alter table patients
  add column email text,
  add column notes text,           -- staff notes, never shown to the bot
  add column tags text[] not null default '{}';

revoke update on patients, appointments, conversations from authenticated;
grant update (name, phone, email, notes, tags) on patients to authenticated;
grant update (status) on appointments to authenticated;
grant update (bot_paused, updated_at) on conversations to authenticated;

-- Insert: staff lines in the transcript only.
create policy "members insert staff messages" on messages for insert to authenticated
  with check (role = 'staff' and is_member(clinic_id));

-- Schema additions
alter table appointments drop constraint appointments_source_check;
alter table appointments add constraint appointments_source_check
  check (source in ('chat', 'followup', 'waitlist', 'recall', 'staff'));
-- appointments.status already allows 'completed' and 'no_show' (0003_revenue.sql).

-- Live inbox, calendar and tallies.
alter publication supabase_realtime add table messages, conversations, appointments;
