// Tenants: each clinic row carries its config; its UltraMsg credentials live in clinic_secrets (service role only).
import { db } from "./db";
import type { Hours } from "./slots";
import { normInstance, type WaCreds } from "./whatsapp";

export type Service = { name: string; name_ar: string; minutes: number; price_aed: number };
export type Clinic = {
  id: string;
  slug: string | null;
  name: string;
  utc_offset_minutes: number;
  hours: Hours;
  services: Service[];
  insurers: string[];
  faq: { q: string; a: string }[];
  phone: string | null;
  address: string | null;
  maps_url: string | null;
  persona: { name?: string };
  branding: { logo?: string; accent?: string };
  staff_whatsapp: string | null;
  ultramsg_instance_id: string | null;
  active: boolean;
  wa: WaCreds | null; // null = WhatsApp not connected
  webhook_secret: string | null;
};

type Row = Omit<Clinic, "wa" | "webhook_secret"> & {
  clinic_secrets: { ultramsg_token: string; webhook_secret: string } | null;
};

const SELECT = "*, clinic_secrets(ultramsg_token, webhook_secret)";

function toClinic({ clinic_secrets: s, ...row }: Row): Clinic {
  return {
    ...row,
    persona: row.persona ?? {},
    branding: row.branding ?? {},
    wa: s && row.ultramsg_instance_id ? { instanceId: row.ultramsg_instance_id, token: s.ultramsg_token } : null,
    webhook_secret: s?.webhook_secret ?? null,
  };
}

export const personaName = (c: Pick<Clinic, "persona">) => c.persona?.name || "Sara";

// ponytail: clinic rows cached per server process for 5 min, so clinic edits show up within 5 min. P3 settings clears it on save.
const TTL = 300_000;
const cache = new Map<string, { clinic: Clinic; at: number }>();
const remember = (clinic: Clinic) => (cache.set(clinic.id, { clinic, at: Date.now() }), clinic);

export async function loadClinic(id: string): Promise<Clinic> {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < TTL) return hit.clinic;
  const { data, error } = await db().from("clinics").select(SELECT).eq("id", id).single();
  if (error) throw error;
  return remember(toClinic(data as Row));
}

export async function clinicByInstance(instanceId: string): Promise<Clinic | null> {
  const id = normInstance(instanceId);
  for (const { clinic, at } of cache.values()) if (clinic.ultramsg_instance_id === id && Date.now() - at < TTL) return clinic;
  const { data, error } = await db().from("clinics").select(SELECT).eq("ultramsg_instance_id", id).maybeSingle();
  if (error) throw error;
  return data ? remember(toClinic(data as Row)) : null;
}

export async function activeClinics(): Promise<Clinic[]> {
  const { data, error } = await db().from("clinics").select(SELECT).eq("active", true);
  if (error) throw error;
  return (data as Row[]).map((r) => remember(toClinic(r)));
}

export async function clinicBySlug(slug: string): Promise<Clinic | null> {
  for (const { clinic, at } of cache.values()) if (clinic.slug === slug && Date.now() - at < TTL) return clinic;
  const { data, error } = await db().from("clinics").select(SELECT).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? remember(toClinic(data as Row)) : null;
}
