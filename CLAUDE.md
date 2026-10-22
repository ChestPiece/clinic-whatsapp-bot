@AGENTS.md

# Clinic WhatsApp Bot

WhatsApp AI receptionist for UAE dental clinics (Dubai first), English + Arabic. Approved plan: `~/.claude/plans/i-want-to-make-tender-wall.md` (Phases 0-6).

## Decisions
- WhatsApp via **UltraMsg** (owner's decision, no Meta). Unofficial, so the number can be banned: use a spare SIM, pace sends, no WhatsApp buttons. All provider code lives in `src/lib/whatsapp.ts`.
- Next.js route handlers (Vercel Hobby). Webhook: `POST /api/whatsapp?secret=WEBHOOK_SECRET`, returns 200 fast, work runs in `after()`.
- AI: `@openai/agents` (SDK default model, override with `OPENAI_DEFAULT_MODEL`). The LLM never invents slots; it only calls booking tools. Vercel Chat SDK was evaluated and skipped: its WhatsApp adapter is Meta Cloud API only.
- Data: Supabase. Schema in `supabase/migrations/`, sample clinic in `supabase/seed.sql`; the owner runs SQL in the Supabase SQL editor. One clinic per deployment (`CLINIC_ID`). Synthetic/fake clinic data only, labeled sample. No real patient data until a UAE-region host is in place.
- Safety: no medical advice, emergency reply with the UAE emergency number, never confirm insurance coverage, human handoff, no PHI in logs.
- Persona "Sara", the clinic receptionist. She admits she is the clinic's virtual assistant if asked. Clinic topics only; off-topic questions get a one-line kind decline and a steer back to booking, never a handoff.
- No SDK input/output guardrails: each one is an extra model call per message. Scope rules live in the prompt; safety-critical checks are deterministic code.

## Rules
- The owner's phone number and all keys stay in `.env.local` only, never in tracked files.
- Commit only when asked.
- Ask before any Supabase write; the owner runs SQL in the SQL editor.

## Commands
```bash
npm run dev
npm test        # vitest
npm run lint
```

## Production
- Vercel project `chestpieces-projects/clinic-whatsapp-bot`. Public URL: `https://sara-clinic-bot.vercel.app`, added as a project domain through the Vercel API. The default `*-chestpieces-projects.vercel.app` URLs sit behind Vercel deployment protection, which redirects with a 302, so UltraMsg cannot reach them.
- The UltraMsg webhook points at `https://sara-clinic-bot.vercel.app/api/whatsapp?secret=…`. Deploy with `npx vercel deploy --prod`. Env vars live in Vercel production and in `.env.local`.
- Local testing takes webhook traffic away from prod. Point UltraMsg back to prod when done.

## Local testing
- Dev server plus a cloudflared quick tunnel. The tunnel URL changes on every restart: update the UltraMsg webhook (`POST /instance/settings`, `webhook_url`) each time.
- UltraMsg settings: only "Webhook on Received" on, `sendDelay=1`, `sendDelayMax=3`.
- To reset a test chat, delete its `conversations` row in Supabase.
- The webhook secret travels in the query string (UltraMsg has no signature header), so it shows in tunnel and Vercel request logs. Rotate it if those logs are ever shared.

## How `handleMessage` works (`src/lib/agent.ts`)
1. Dedupe insert (`processed_messages`, with `patient_wa`) and clinic load (cached 5 min) in parallel.
2. Rate limit: more than 20 messages from one sender in 10 min gets one "slow down" reply, then silence (emergencies still get the fixed reply). Then `markRead` (blue ticks; UltraMsg has no typing indicator).
3. Input caps: text cut to 1,500 chars; voice notes only from public https URLs and under 3 MB.
4. Emergency (`safety.ts`, deterministic EN/AR regex): fixed 998 reply, appended to history, model does not run. Works even when the chat is paused.
5. Debounce 1.5 s, in the DB so it works across Vercel instances: each piece's text goes in `processed_messages.body`; only the newest piece (`seq`) runs the model and answers every unanswered piece from the last 5 min. If a newer piece arrives while the model runs, the older reply is dropped, unless the older run wrote data (`wroteData`: book, cancel, reschedule, handoff).
6. Paused chat (`stillPaused`): staff own it; the patient's messages are still saved to history; the pause lapses after 30 min.
7. Run the agent, send `tidy(reply)` (no en/em dashes), log `[timing]`, then append this run's turns to the latest saved history (`mergeHistory`) and keep the last 10 turns.

## Outbound jobs (`src/lib/jobs.ts`, `POST /api/cron?secret=CRON_SECRET`)
- pg_cron + pg_net call the cron route every 15 min. The schedule SQL is at the bottom of `0003_revenue.sql`.
- Reminders: 24h and 2h before a booked visit, in English and Arabic, with "Reply 1 to confirm or 2 to change it". A visit gets no reminder for a window it was booked inside. Each reminder is claimed (`reminded_*_at`) before it is sent, so it goes out at most once. The reminder text is appended to the chat history, so the agent understands the "1" or "2" reply (`confirm_visit` tool; a reschedule clears `confirmed_at`).
- Follow-up: one nudge when a patient's last message is 3 to 20 h old and they have nothing booked, are not opted out and the chat is not paused. Only one per quiet inquiry (`conversations.followup_sent_at`). The nudge names the last service mentioned in the chat and the next free time. A booking within 48 h of the nudge gets `source='followup'`.
- STOP (or توقف) as a whole message sets `patients.opted_out`: no follow-up, recall or waitlist messages, but reminders still go out. "الغاء" is not a stop word, because it means "cancel".
- Outbound limits: no messages between 21:00 and 09:00 clinic time, and at most 20 per run.

Booking limits: at most 3 upcoming visits per patient, and dates up to 60 days ahead. A stored patient name is never overwritten by a later booking.
Errors: the SORRY reply promises a staff reply only when `STAFF_WHATSAPP` is set; otherwise it gives the clinic phone.

Handoff pauses a chat only when `STAFF_WHATSAPP` is set; without it the bot keeps helping and gives the clinic phone.

## Status
- Phase 0: webhook + `parseWebhook` tests done.
- Phase 1 done and tested live (book, cancel) on 2026-10-22.
- Phase 1.5 (natural tone + speed) done and stress-tested live on 2026-10-22: off-topic declines, no dashes, booking with "best one" choice all good. Fixed after that test: double emergency reply, and two replies to a split message.
- Break-test and hardening on 2026-10-22 (`0002_hardening.sql`): rate limit, input caps, voice URL guard, booking caps, wider EN/AR/Arabizi emergency regex without the "accident last year" false alarm, DB debounce for Vercel, history merge, paused-chat history, honest error reply.
- 2026-10-22: `0002_hardening.sql` applied, replays re-verified, deployed to Vercel (R0 and R1 of the revenue roadmap in `~/.claude/plans/check-up-the-whatsapp-ethereal-pearl.md`).
- Next: R2 (reminders + confirm), then R3 follow-up, R4 waitlist + recall, R5 intake, R6 inbox + Sunday report, R7 evals, R8 pitch. Phase 5 evals must include the stress transcripts (off-topic, split messages, "hello?", emergency then "just joking").
