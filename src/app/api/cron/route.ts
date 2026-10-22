import { runJobs } from "@/lib/jobs";
import { secretMatches } from "@/lib/whatsapp";

// Called every 15 min by pg_cron + pg_net: POST https://<host>/api/cron?secret=<CRON_SECRET>
export async function POST(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (!secretMatches(secret, process.env.CRON_SECRET)) return new Response("forbidden", { status: 403 });
  const result = await runJobs();
  console.log(`[cron] reminders=${result.reminders} quiet=${result.quiet}`);
  return Response.json(result);
}
