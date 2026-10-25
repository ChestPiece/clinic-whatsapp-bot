# P0 Multi-tenant Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One deployment serves many clinics over WhatsApp, with the agent brain split out so the web widget (P1) can reuse it. No visible change for the demo clinic.

**Architecture:** Clinic config and UltraMsg credentials move from env vars into the DB (`clinics` columns + service-role-only `clinic_secrets`). The webhook routes each message to its clinic by the payload `instanceId`. The agent, tools and prompt move to `src/lib/sara.ts`; `src/lib/agent.ts` stays the WhatsApp adapter. Every patient/assistant turn is also written to a readable `messages` table, and token usage to `usage_events`.

**Tech Stack:** Next.js 16 route handlers, `@openai/agents` 0.21, Supabase (service role), vitest.

**Spec:** `~/.claude/plans/load-up-the-superwer-cozy-firefly.md` (section P0).

## Global Constraints
- Anas pastes every migration in the Supabase SQL editor. No Supabase writes from tools.
- Secrets (UltraMsg token, webhook secret, phone numbers) never in tracked files. Backfill SQL uses `<PLACEHOLDER>` values.
- Commit only when asked. Push to `master` deploys prod: migration must be applied before push.
- No PHI in logs.
- Keep existing behaviour: debounce, rate limit, emergency, STOP, pause, reminders, follow-ups.

## Scope cut vs spec (ponytail)
- `memberships`, `platform_admins`, RLS policies: moved to P2 (first code that reads them is the dashboard).
- `patients.web_visitor_id/phone/email`, `conversations.channel`: moved to P1 (first code that writes them is `/api/chat`).
- `ALLOWED_SENDERS` stays a global env allowlist for the demo.

## Review Focus
- Same patient number messaging two clinics: rate limit, debounce and follow-ups must count per clinic, not merge. Every `processed_messages` query filters `clinic_id`.
- Webhook from an unknown `instanceId` or a known instance with the wrong secret: 403/ignored, no DB writes.
- Clinic with no `staff_whatsapp`: handoff behaves as today without `STAFF_WHATSAPP` (no pause, gives phone).
- Clinic missing `clinic_secrets` row: cron skips it with a log line, other clinics still run.
- `messages` insert failure must never block or duplicate the patient reply (log only).

---

### Task 1: Migration `0004_tenants.sql`

**Files:**
- Create: `supabase/migrations/0004_tenants.sql`

- [ ] **Step 1:** Write the migration:
  - `clinics` add `slug text unique`, `branding jsonb not null default '{}'`, `persona jsonb not null default '{}'` (`{"name":"Sara"}`), `allowed_origins text[] not null default '{}'`, `staff_whatsapp text`, `ultramsg_instance_id text unique` (stored without the `instance` prefix), `active boolean not null default true`.
  - `clinic_secrets (clinic_id uuid pk references clinics on delete cascade, ultramsg_token text not null, webhook_secret text not null)`, RLS on, no policies.
  - `processed_messages` add `clinic_id uuid references clinics on delete cascade`; index `(clinic_id, patient_wa, seq)`.
  - `messages (id bigint identity pk, clinic_id, patient_id, channel text check in ('whatsapp','web'), role text check in ('patient','assistant','staff','system'), body text not null, created_at)`; index `(clinic_id, created_at desc)`, `(patient_id, created_at)`. RLS on.
  - `usage_events (id bigint identity pk, clinic_id, channel, requests int, input_tokens int, output_tokens int, created_at)`; index `(clinic_id, created_at)`. RLS on.
  - Commented backfill block for the sample clinic: slug `sample-smile`, `ultramsg_instance_id '<INSTANCE_ID_DIGITS>'`, `staff_whatsapp '<STAFF_WHATSAPP or null>'`, insert `clinic_secrets` with `<ULTRAMSG_TOKEN>`, `<WEBHOOK_SECRET>`; `update processed_messages set clinic_id = …` for old rows.

### Task 2: WhatsApp module takes per-clinic credentials

**Files:**
- Modify: `src/lib/whatsapp.ts`, `src/lib/whatsapp.test.ts`

**Interfaces:**
- Produces: `type WaCreds = { instanceId: string; token: string }`; `normInstance(id: string): string` (strips `instance` prefix); `parseWebhook(payload: unknown): (IncomingMessage & { instanceId: string }) | null` (no instance argument; empty instanceId → null); `sendText(creds, to, body)`, `markRead(creds, chatId)`, `sendMedia(creds, to, imageUrl, caption?)`.

- [ ] **Step 1:** Update tests: `parseWebhook(payload({}))` returns `instanceId: "12345"`; payload `instanceId: "instance12345"` also returns `"12345"`; missing instanceId → null; existing ignore cases unchanged. `normInstance("instance12345") === "12345"`.
- [ ] **Step 2:** `npm test -- whatsapp` fails.
- [ ] **Step 3:** Implement. `base(creds)` builds the URL; `post(creds, path, fields)` sends `token: creds.token`.
- [ ] **Step 4:** `npm test -- whatsapp` passes.

### Task 3: Clinic loaders + logging helpers

**Files:**
- Create: `src/lib/clinics.ts`
- Modify: `src/lib/db.ts`

**Interfaces:**
- Produces (`clinics.ts`): `type Clinic` (old fields + `slug`, `persona: { name?: string }`, `staff_whatsapp: string | null`, `ultramsg_instance_id: string | null`, `wa: WaCreds | null`, `webhook_secret: string | null`); `loadClinic(id: string): Promise<Clinic>` (Map cache, 5-min TTL); `clinicByInstance(instanceId: string): Promise<Clinic | null>`; `activeClinics(): Promise<Clinic[]>`; `personaName(c: Clinic): string` (`c.persona.name || "Sara"`).
  Select: `*, clinic_secrets(ultramsg_token, webhook_secret)`, flattened into `wa` / `webhook_secret`.
- Produces (`db.ts`): `logMessages(clinicId, patientId, channel: "whatsapp" | "web", rows: { role: "patient" | "assistant" | "staff" | "system"; body: string }[]): Promise<void>` and `logUsage(clinicId, channel, usage: { requests; inputTokens; outputTokens }): Promise<void>`. Both catch and `console.error`, never throw.

- [ ] **Step 1:** Test `personaName` in `src/lib/clinics.test.ts`: `{persona:{}}` → `"Sara"`, `{persona:{name:"Layla"}}` → `"Layla"`.
- [ ] **Step 2:** Implement; test passes.

### Task 4: Extract the agent brain to `sara.ts`

**Files:**
- Create: `src/lib/sara.ts`
- Modify: `src/lib/agent.ts`, `src/lib/agent.test.ts`, `src/lib/jobs.ts` (import path)

**Interfaces:**
- Consumes: `Clinic`, `personaName` (Task 3), `sendText(creds…)` (Task 2).
- Produces (`sara.ts`): `type Service`; `slotsOn(c, service, date, ignoreId?)`; `tooFar(date, today)`; `wroteData(items)`; `runSara(clinic: Clinic, patient: { id: string; name: string | null }, waId: string | null, input: AgentInputItem[])` → `RunResult` (returns `run(receptionist, input, { context })`).
- Moves unchanged: tools, `checkSlot`, `upcoming`, `bookedOn`, constants `MAX_UPCOMING`, `HORIZON_DAYS`, `TAKEN`, `WRITES`.
- Changes: prompt says `You are ${personaName(c)}`; `handoff_to_staff` uses `clinic.staff_whatsapp` and `clinic.wa` (no staff or no creds → today's "no staff" message).

- [ ] **Step 1:** Move code; `agent.test.ts` imports `tooFar`, `wroteData` from `./sara`.
- [ ] **Step 2:** `npm test` passes, `npx tsc --noEmit` clean.

### Task 5: WhatsApp adapter is clinic-aware

**Files:**
- Modify: `src/lib/agent.ts`, `src/app/api/whatsapp/route.ts`

**Interfaces:**
- Produces: `handleMessage(clinic: Clinic, msg: IncomingMessage): Promise<void>`.

- [ ] **Step 1:** Route: `parseWebhook(payload)` → `clinicByInstance(msg.instanceId)`; reject 403 unless clinic found, `active`, and `secretMatches(secret, clinic.webhook_secret)`. Log outcome as today (`unknown instance` added). Then `after(() => handleMessage(clinic, msg))`.
- [ ] **Step 2:** `handleMessage`: drop `loadClinic()`; `processed_messages` insert carries `clinic_id`; rate count, `newestPiece`, pieces query filter `clinic_id`; `sendText`/`markRead` use `clinic.wa`; `sorry(clinic.phone, clinic.staff_whatsapp)`; `runSara(clinic, patient, msg.from, [...saved, user(text)])`.
- [ ] **Step 3:** Log turns: after a reply is sent, `logMessages(clinic.id, patient.id, "whatsapp", [{role:"patient", body:text}, {role:"assistant", body:reply}])` and `logUsage(clinic.id, "whatsapp", result.state.usage)`. Emergency and STOP paths log patient + fixed reply. Paused path logs patient only.
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit` clean.

### Task 6: Jobs loop every active clinic

**Files:**
- Modify: `src/lib/jobs.ts`, `src/app/api/cron/route.ts`

- [ ] **Step 1:** `runJobs(now)` loops `activeClinics()`; skip a clinic without `wa` (log `[cron] <slug> no whatsapp`); quiet hours and `MAX_SENDS` per clinic (each clinic has its own number). Returns totals `{ reminders, followups, clinics }`. One clinic's error is caught and logged; others continue.
- [ ] **Step 2:** `send()` takes the clinic, uses `clinic.wa`, logs via `logMessages(…, [{role:"system", body:text}])` besides `appendToChat`. Follow-up piece query filters `clinic_id`. `followupText` uses `personaName(clinic)` (add `persona` param; update test: default "Sara").
- [ ] **Step 3:** Cron route logs `[cron] clinics=… reminders=… followups=…`.
- [ ] **Step 4:** `npm test`, `npm run lint`, `npm run build` all pass.

### Task 7: Docs + local replay
- [ ] **Step 1:** CLAUDE.md: env vars `CLINIC_ID`, `ULTRAMSG_INSTANCE_ID`, `ULTRAMSG_TOKEN`, `STAFF_WHATSAPP`, `WEBHOOK_SECRET` replaced by DB columns; new clinic = insert `clinics` + `clinic_secrets` rows; status line for P0.
- [ ] **Step 2 (after Anas applies 0004 + backfill):** local dev + fake webhook replay to the sample clinic; check reply, `messages` rows, `usage_events` row. Then live WhatsApp book/cancel after deploy.
