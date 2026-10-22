// Outbound jobs run by POST /api/cron every 15 min (pg_cron + pg_net). Today: 24h and 2h visit reminders.
import { assistant, type AgentInputItem } from "@openai/agents";
import { loadClinic, trimHistory } from "./agent";
import { db } from "./db";
import { sendText } from "./whatsapp";

const HOUR = 3_600_000;
const MIN_LEAD_MS = 30 * 60_000; // a reminder this close to the visit is noise
const MAX_SENDS = 20; // per run: pace outbound traffic so the UltraMsg number does not look like a bulk sender

// Patients only get messages they did not ask for between 09:00 and 21:00 clinic time.
export const quietHours = (now: Date, offsetMin: number) => {
  const h = new Date(now.getTime() + offsetMin * 60_000).getUTCHours();
  return h < 9 || h >= 21;
};

type Visit = { starts_at: string; created_at: string; reminded_24h_at: string | null; reminded_2h_at: string | null };

// Which reminder is due now. A visit booked inside a window gets no reminder for it (the patient just booked).
// ponytail: a reschedule keeps the old created_at, so a visit moved to within 2h gets an immediate 2h reminder.
export function reminderDue(v: Visit, now: Date): "24h" | "2h" | null {
  const start = Date.parse(v.starts_at);
  const created = Date.parse(v.created_at);
  const left = start - now.getTime();
  if (left < MIN_LEAD_MS) return null;
  if (left <= 2 * HOUR) return !v.reminded_2h_at && created < start - 2 * HOUR ? "2h" : null;
  if (left <= 24 * HOUR) return !v.reminded_24h_at && created < start - 24 * HOUR ? "24h" : null;
  return null;
}

const when = (d: Date, offsetMin: number, locale: string) =>
  new Date(d.getTime() + offsetMin * 60_000).toLocaleString(locale, {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

// Bilingual, like the other fixed replies: the patient's language is not stored.
export function reminderText(r: { name: string | null; service: string; startsAt: Date; clinic: string; offsetMin: number }) {
  const first = r.name?.trim().split(/\s+/)[0];
  return `Hi${first ? ` ${first}` : ""}, a reminder of your ${r.service} at ${r.clinic} on ${when(r.startsAt, r.offsetMin, "en-US")}. Reply 1 to confirm or 2 to change it.
مرحباً${first ? ` ${first}` : ""}، تذكير بموعدك (${r.service}) في ${r.clinic} يوم ${when(r.startsAt, r.offsetMin, "ar-AE")}. أرسل 1 للتأكيد أو 2 لتغيير الموعد.`;
}

export async function runJobs(now = new Date()) {
  const clinic = await loadClinic();
  if (quietHours(now, clinic.utc_offset_minutes)) return { reminders: 0, quiet: true };
  const sb = db();
  const { data, error } = await sb
    .from("appointments")
    .select("id, service, starts_at, created_at, reminded_24h_at, reminded_2h_at, patient_id, patients(wa_id, name)")
    .eq("clinic_id", clinic.id)
    .eq("status", "booked")
    .gt("starts_at", new Date(now.getTime() + MIN_LEAD_MS).toISOString())
    .lte("starts_at", new Date(now.getTime() + 24 * HOUR).toISOString())
    .order("starts_at");
  if (error) throw error;

  let sent = 0;
  for (const v of data) {
    if (sent >= MAX_SENDS) break;
    const kind = reminderDue(v, now);
    if (!kind) continue;
    const column = kind === "24h" ? "reminded_24h_at" : "reminded_2h_at";
    // Claim before sending, so overlapping runs never send twice (at most once; a failed send is not retried).
    const { data: claimed, error: claimError } = await sb
      .from("appointments")
      .update({ [column]: now.toISOString() })
      .eq("id", v.id)
      .is(column, null)
      .select("id");
    if (claimError) throw claimError;
    if (!claimed.length) continue;
    const patient = v.patients as unknown as { wa_id: string; name: string | null };
    const text = reminderText({ name: patient.name, service: v.service, startsAt: new Date(v.starts_at), clinic: clinic.name, offsetMin: clinic.utc_offset_minutes });
    try {
      await sendText(patient.wa_id, text);
      sent++;
    } catch (e) {
      console.error("[reminder]", (e as Error).message);
      continue;
    }
    // In the chat history, so the agent understands a "1" or "2" reply.
    const { data: convo } = await sb.from("conversations").select("history").eq("patient_id", v.patient_id).maybeSingle();
    const history = (convo?.history ?? []) as AgentInputItem[];
    const { error: historyError } = await sb
      .from("conversations")
      .upsert({ patient_id: v.patient_id, history: trimHistory([...history, assistant(text)]) }); // updated_at untouched: it times a staff pause
    if (historyError) console.error("[reminder history]", historyError.message);
  }
  return { reminders: sent, quiet: false };
}
