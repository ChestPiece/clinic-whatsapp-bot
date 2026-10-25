"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loadClinic } from "@/lib/clinics";
import { CLINIC_COOKIE } from "@/lib/dashboard";
import { appendToChat } from "@/lib/jobs";
import { supabaseServer } from "@/lib/supabase/server";
import { sendText } from "@/lib/whatsapp";

// Every action goes through the user's client first, so RLS decides whether the row is theirs.

export async function pickClinic(form: FormData) {
  (await cookies()).set(CLINIC_COOKIE, String(form.get("clinic")), { path: "/dashboard", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  refresh();
}

export async function signOut() {
  await (await supabaseServer()).auth.signOut();
  redirect("/login");
}

// Take over pauses Sara for this chat; the pause lapses 30 min after the last staff activity (stillPaused).
export async function setPaused(patientId: string, paused: boolean) {
  const sb = await supabaseServer();
  const { error } = await sb.from("conversations").update({ bot_paused: paused, updated_at: new Date().toISOString() }).eq("patient_id", patientId);
  if (error) throw new Error("Could not update the chat.");
  refresh();
}

export async function staffReply(patientId: string, form: FormData): Promise<string | null> {
  const text = String(form.get("text") ?? "").trim().slice(0, 1500);
  if (!text) return null;
  const sb = await supabaseServer();
  const { data: patient } = await sb.from("patients").select("id, clinic_id, wa_id").eq("id", patientId).maybeSingle();
  if (!patient?.wa_id) return "Only WhatsApp chats can be answered here.";
  // Credentials come from clinic_secrets, which only the service role can read.
  const clinic = await loadClinic(patient.clinic_id);
  if (!clinic.wa) return "WhatsApp is not connected for this clinic.";
  try {
    await sendText(clinic.wa, patient.wa_id, text);
  } catch {
    return "WhatsApp did not accept the message. Try again.";
  }
  await Promise.all([
    sb.from("messages").insert({ clinic_id: patient.clinic_id, patient_id: patient.id, channel: "whatsapp", role: "staff", body: text }),
    // A staff reply keeps the chat paused and tells Sara what was said, for when she takes it back.
    sb.from("conversations").update({ bot_paused: true, updated_at: new Date().toISOString() }).eq("patient_id", patient.id),
    appendToChat(patient.id, text),
  ]);
  refresh();
  return null;
}

const STATUSES = ["booked", "completed", "no_show", "cancelled"];
export async function setVisitStatus(id: string, status: string) {
  if (!STATUSES.includes(status)) return;
  const sb = await supabaseServer();
  const { error } = await sb.from("appointments").update({ status }).eq("id", id);
  // The exclusion constraint refuses moving a cancelled visit back onto a taken slot.
  if (error) throw new Error(error.code === "23P01" ? "That time is taken now." : "Could not update the visit.");
  refresh();
}

export async function savePatient(id: string, form: FormData) {
  const field = (k: string) => String(form.get(k) ?? "").trim() || null;
  const tags = String(form.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const sb = await supabaseServer();
  const { error } = await sb.from("patients").update({ name: field("name"), phone: field("phone"), email: field("email"), notes: field("notes"), tags: [...new Set(tags)] }).eq("id", id);
  if (error) throw new Error("Could not save the patient.");
  refresh();
}
