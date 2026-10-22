// All WhatsApp traffic goes through this file (UltraMsg today). Swap providers here only.
import { timingSafeEqual } from "node:crypto";

export type IncomingMessage = {
  id: string;
  from: string; // UltraMsg chat id, e.g. "971501234567@c.us"
  type: string; // chat | image | ptt | audio | document | location | ...
  body: string;
  mediaUrl: string | null;
  pushname: string;
};

const base = () => `https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE_ID}`;

// Returns null for anything we must not answer: other events, our own sends, groups, wrong instance.
export function parseWebhook(payload: unknown, instanceId: string): IncomingMessage | null {
  const p = payload as { event_type?: string; instanceId?: string | number; data?: Record<string, unknown> };
  if (p?.event_type !== "message_received" || !p.data) return null;
  // Dashboard/API id is "instance12345", webhook payload sends "12345".
  const id = instanceId.replace(/^instance/, "");
  if (!id || String(p.instanceId).replace(/^instance/, "") !== id) return null;
  const d = p.data;
  if (d.fromMe === true || d.self === true) return null;
  const from = String(d.from ?? "");
  if (!from.endsWith("@c.us")) return null; // ignore groups (@g.us), status, broadcasts
  return {
    id: String(d.id ?? ""),
    from,
    type: String(d.type ?? "chat"),
    body: String(d.body ?? ""),
    mediaUrl: d.media ? String(d.media) : null,
    pushname: String(d.pushname ?? ""),
  };
}

export function secretMatches(given: string | null, expected: string | undefined): boolean {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function post(path: string, fields: Record<string, string>) {
  const res = await fetch(`${base()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: process.env.ULTRAMSG_TOKEN ?? "", ...fields }),
  });
  if (!res.ok) throw new Error(`UltraMsg ${path} failed: ${res.status}`);
  return res.json();
}

export const sendText = (to: string, body: string) => post("/messages/chat", { to, body });

// Blue ticks, so the patient sees the message was read while the reply is prepared. UltraMsg has no typing indicator.
export const markRead = (chatId: string) => post("/chats/read", { chatId });

export const sendMedia = (to: string, imageUrl: string, caption = "") =>
  post("/messages/image", { to, image: imageUrl, caption });
