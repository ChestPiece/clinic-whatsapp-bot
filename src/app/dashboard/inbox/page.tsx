import Link from "next/link";
import { Line, Typed } from "@/components/ledger";
import { stillPaused } from "@/lib/agent";
import { desk, who } from "@/lib/dashboard";
import { localTime } from "@/lib/slots";
import { cn } from "@/lib/utils";
import { ReplyBox } from "./reply-box";
import { setPaused } from "../actions";

export const metadata = { title: "Inbox" };

type Msg = { id: number; patient_id: string; channel: "whatsapp" | "web"; role: "patient" | "assistant" | "staff" | "system"; body: string; created_at: string };
type Person = { id: string; name: string | null; phone: string | null; wa_id: string | null };
const SPEAKER = { patient: "Patient", assistant: "Sara", staff: "Staff", system: "Note" } as const;

export default async function Inbox({ searchParams }: PageProps<"/dashboard/inbox">) {
  const { sb, clinic } = await desk();
  if (!clinic) return null;
  const { p, f } = (await searchParams) as { p?: string; f?: string };

  // ponytail: the list is built from the newest 500 transcript lines; move to a "last message per patient" view when clinics outgrow it.
  const { data: recent } = await sb.from("messages").select("id, patient_id, channel, role, body, created_at").eq("clinic_id", clinic.id).order("id", { ascending: false }).limit(500);
  const latest = new Map<string, Msg>();
  for (const m of (recent ?? []) as Msg[]) if (!latest.has(m.patient_id)) latest.set(m.patient_id, m);
  const ids = [...latest.keys()];

  const [{ data: people }, { data: convos }] = await Promise.all([
    sb.from("patients").select("id, name, phone, wa_id").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    sb.from("conversations").select("patient_id, bot_paused, updated_at").in("patient_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
  ]);
  const person = new Map(((people ?? []) as Person[]).map((x) => [x.id, x]));
  const waiting = new Set((convos ?? []).filter((c) => stillPaused(c)).map((c) => c.patient_id as string));
  const list = ids.filter((id) => f !== "staff" || waiting.has(id));
  const open = p && person.has(p) ? p : list[0];

  const { data: thread } = open ? await sb.from("messages").select("id, patient_id, channel, role, body, created_at").eq("patient_id", open).order("id", { ascending: false }).limit(200) : { data: null };
  const lines = ((thread ?? []) as Msg[]).reverse();
  const current = open ? person.get(open) : undefined;
  const isPaused = open ? waiting.has(open) : false;
  const time = (iso: string) => localTime(new Date(iso), clinic.utc_offset_minutes);
  const href = (q: Record<string, string | undefined>) => `/dashboard/inbox?${new URLSearchParams(Object.entries({ f, ...q }).filter((e): e is [string, string] => !!e[1]))}`;

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b py-8">
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">Inbox</h1>
        <div className="flex gap-1 text-sm" role="group" aria-label="Filter">
          <Link href={href({ f: undefined, p: open })} aria-current={f !== "staff" ? "true" : undefined} className={cn("rounded-full px-3 py-1.5 text-muted-foreground", f !== "staff" && "bg-foreground text-background")}>All</Link>
          <Link href={href({ f: "staff", p: undefined })} aria-current={f === "staff" ? "true" : undefined} className={cn("rounded-full px-3 py-1.5 text-muted-foreground", f === "staff" && "bg-alert text-white")}>Needs staff · {waiting.size}</Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-[320px_1fr]">
        <ul className={cn("slip divide-y overflow-hidden lg:max-h-[calc(100dvh-180px)] lg:overflow-y-auto", open && p && "max-lg:hidden")}>
          {list.length === 0 && <li className="p-5 text-sm text-muted-foreground">{f === "staff" ? "Nobody is waiting for staff." : "No chats yet."}</li>}
          {list.map((id) => {
            const m = latest.get(id)!;
            return (
              <li key={id}>
                <Link href={href({ p: id })} aria-current={id === open ? "true" : undefined} className={cn("grid gap-1 px-4 py-3 transition-colors hover:bg-rule/60", id === open && "bg-rule/80")}>
                  <span className="flex items-center gap-2">
                    <span className="truncate font-serif text-[17px]">{who(person.get(id) ?? null)}</span>
                    <span className="ms-auto font-mono text-[11px] text-muted-foreground tabular-nums">{time(m.created_at)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Channel channel={m.channel} />
                    {waiting.has(id) ? <span className="text-xs font-medium text-alert">Needs you</span> : <span className="text-xs text-muted-foreground">Sara</span>}
                  </span>
                  <span dir="auto" className="line-clamp-1 text-sm text-muted-foreground">{m.body}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {open && current ? (
          <section className={cn("slip torn-top relative flex min-h-[520px] flex-col lg:h-[calc(100dvh-180px)]", !p && "max-lg:hidden")}>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed px-5 pt-5 pb-3">
              <div>
                <Link href={href({ p: undefined })} className="label lg:hidden">← All chats</Link>
                <span className="label block max-lg:hidden">{current.wa_id ? `WhatsApp · +${current.wa_id.replace(/@.*/, "")}` : `Website${current.phone ? ` · ${current.phone}` : ""}`}</span>
                <h2 className="font-serif text-[22px]">
                  <Link href={`/dashboard/patients/${current.id}`} className="hover:underline">{who(current)}</Link>
                </h2>
              </div>
              {current.wa_id && (
                <form action={setPaused.bind(null, current.id, !isPaused)}>
                  <button className={cn("rounded-full px-4 py-2 text-[13px] font-medium", isPaused ? "border border-foreground" : "bg-foreground text-background")}>
                    {isPaused ? "Hand back to Sara" : "Take over"}
                  </button>
                </form>
              )}
            </header>
            <div aria-live="polite" className="flex flex-1 flex-col-reverse overflow-y-auto px-5 py-4">
              <div className="flex flex-col gap-3">
                {lines.map((m, i) => (
                  <Line key={m.id} role={m.role} who={SPEAKER[m.role]}>
                    {m.role === "assistant" && i === lines.length - 1 ? <Typed text={m.body} at={m.created_at} /> : m.body}
                  </Line>
                ))}
              </div>
            </div>
            <footer className="border-t border-dashed px-5 py-3">
              {current.wa_id ? (
                <ReplyBox patientId={current.id} paused={isPaused} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Website chats can&apos;t be answered from here yet. {current.phone ? <>Call or WhatsApp <span className="font-mono">{current.phone}</span>.</> : "No phone number left yet."}
                </p>
              )}
            </footer>
          </section>
        ) : null}
      </div>
    </>
  );
}

const Channel = ({ channel }: { channel: "whatsapp" | "web" }) => (
  <span className={cn("rounded-full px-2 py-px text-[11.5px] font-medium text-foreground", channel === "whatsapp" ? "bg-sage-soft" : "bg-web-soft")}>
    {channel === "whatsapp" ? "WhatsApp" : "Website"}
  </span>
);
