import { after } from "next/server";
import { handleMessage } from "@/lib/agent";
import { parseWebhook, secretMatches } from "@/lib/whatsapp";

// UltraMsg webhook URL: https://<host>/api/whatsapp?secret=<WEBHOOK_SECRET>
export async function POST(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (!secretMatches(secret, process.env.WEBHOOK_SECRET)) return new Response("forbidden", { status: 403 });

  const payload = await request.json().catch(() => null);
  const msg = parseWebhook(payload, process.env.ULTRAMSG_INSTANCE_ID ?? "");
  // While the bot runs on a personal number, only answer listed testers (comma-separated chat ids).
  const allowed = (process.env.ALLOWED_SENDERS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  // One line per webhook, no message text (no PHI in logs).
  const outcome = !msg ? "ignored" : allowed.length && !allowed.includes(msg.from) ? "not allowlisted" : "reply";
  console.log(`[webhook] ${payload?.event_type ?? "?"} fromMe=${payload?.data?.fromMe ?? "?"} -> ${outcome}`);

  // Ack now, answer after the response (dedupe happens in the DB inside handleMessage).
  if (msg && outcome === "reply") after(() => handleMessage(msg).catch((e) => console.error("[handle]", e.message)));
  return new Response("ok");
}
