"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type DynamicToolUIPart } from "ai";
import { ArrowUpIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { AppointmentList, BookedCard, Bubble, EASE_OUT, SlotPicker, TypingDots, type Appt, type Booked, type Slots } from "@/components/chat-cards";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputBody, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Badge } from "@/components/ui/badge";
import { InputGroupAddon } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import type { Service } from "@/lib/clinics";
import { DAYS, type Hours } from "@/lib/slots";

type Info = {
  hours: Hours;
  services: Service[];
  address: string | null;
  maps_url: string | null;
};

const DAY_NAME = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};
const WEEK = [DAYS[6], ...DAYS.slice(0, 6)]; // UAE week starts on Saturday

// Groups neighbouring days with the same hours: "Sat–Thu 09:00–21:00", "Fri Closed".
function hourRows(hours: Hours) {
  const rows: { from: (typeof DAYS)[number]; to: (typeof DAYS)[number]; time: string }[] = [];
  for (const d of WEEK) {
    const time = hours[d]?.map(([a, b]) => `${a}–${b}`).join(", ") || "Closed";
    const prev = rows.at(-1);
    if (prev?.time === time) prev.to = d;
    else rows.push({ from: d, to: d, time });
  }
  return rows.map((r) => ({
    days: r.from === r.to ? DAY_NAME[r.from] : `${DAY_NAME[r.from]}–${DAY_NAME[r.to]}`,
    time: r.time,
  }));
}

const label = "font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground";

function ClinicInfo({ info, phone }: { info: Info; phone: string | null }) {
  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-3 overflow-y-auto py-4 pe-4 lg:flex">
      <section className="rounded-[22px] bg-card p-5">
        <h2 className={label}>Hours</h2>
        <dl className="mt-3 flex flex-col gap-1.5 text-sm">
          {hourRows(info.hours).map((r) => (
            <div key={r.days} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{r.days}</dt>
              <dd className="font-mono text-[13px] tabular-nums">{r.time}</dd>
            </div>
          ))}
        </dl>
      </section>
      {info.services.length > 0 && (
        <section className="rounded-[22px] bg-card p-5">
          <h2 className={label}>Services</h2>
          <dl className="mt-3 flex flex-col gap-1.5 text-sm">
            {info.services.map((s) => (
              <div key={s.name} className="flex justify-between gap-4">
                <dt>{s.name}</dt>
                <dd className="shrink-0 font-mono text-[13px] tabular-nums text-muted-foreground">AED {s.price_aed.toLocaleString("en")}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {(info.address || phone) && (
        <section className="rounded-[22px] bg-card p-5 text-sm">
          <h2 className={label}>Find us</h2>
          {info.address && <p className="mt-3">{info.address}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {info.maps_url?.startsWith("https://") && (
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <a href={info.maps_url} target="_blank" rel="noreferrer">
                  <MapPinIcon className="size-4" /> Maps
                </a>
              </Button>
            )}
            {phone && (
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <a href={`tel:${phone}`}>
                  <PhoneIcon className="size-4" /> {phone}
                </a>
              </Button>
            )}
          </div>
        </section>
      )}
    </aside>
  );
}

const STARTERS = ["Book a check-up", "How much is a cleaning?", "Where are you located?", "أبغى أحجز موعد"];

// One anonymous id per browser, so Sara remembers the visitor between visits.
function visitorId() {
  try {
    let id = localStorage.getItem("visitor-id");
    if (!id) localStorage.setItem("visitor-id", (id = crypto.randomUUID()));
    return id;
  } catch {
    return crypto.randomUUID(); // storage blocked: this tab only
  }
}

// Tool output arrives as the tool's return value; string results are errors or notes meant for the model.
const outputOf = (part: DynamicToolUIPart) => {
  if (part.state !== "output-available") return null;
  const out = part.output;
  if (typeof out !== "string") return out as Record<string, unknown>;
  try {
    return JSON.parse(out) as Record<string, unknown>;
  } catch {
    return null;
  }
};

function ToolCard({ part, onPick, busy }: { part: DynamicToolUIPart; onPick: (text: string) => void; busy: boolean }) {
  if (part.state === "input-streaming" || part.state === "input-available")
    return <Shimmer className="text-sm">{part.toolName === "find_slots" ? "Checking free times…" : "One moment…"}</Shimmer>;
  const out = outputOf(part);
  if (!out) return null;
  if (part.toolName === "find_slots" && "days" in out) return <SlotPicker slots={out as Slots} onPick={onPick} busy={busy} />;
  if (part.toolName === "book" && "booked" in out) return <BookedCard booked={out as Booked} />;
  if (part.toolName === "my_appointments" && Array.isArray(out)) return <AppointmentList appts={out as Appt[]} />;
  return null;
}

// Only newly mounted messages move in; streaming updates re-render without re-animating.
function Enter({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
      {children}
    </motion.div>
  );
}

export function Chat({ slug, clinicName, persona, phone, logo, info }: { slug: string; clinicName: string; persona: string; phone: string | null; logo?: string; info: Info }) {
  const sample = /\(sample data\)/i.test(clinicName);
  const name = clinicName.replace(/\s*\(sample data\)/i, "");
  const [id] = useState(visitorId);
  const [greeted, setGreeted] = useState(false);
  const reduce = useReducedMotion();
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { slug, visitorId: id, message: messages.at(-1) },
      }),
    }),
  });
  const busy = status === "submitted" || status === "streaming";
  const send = (text: string) => !busy && text.trim() && sendMessage({ text });

  // Sara "types" her greeting for a beat so the chat opens like a person picked up.
  useEffect(() => {
    const t = setTimeout(() => setGreeted(true), reduce ? 0 : 700);
    return () => clearTimeout(t);
  }, [reduce]);

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex items-center justify-between gap-3 border-b bg-card/80 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- clinic logos live on arbitrary hosts
            <img src={logo} alt={name} width={36} height={36} className="size-9 rounded-full object-cover" />
          ) : (
            <div aria-hidden className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {persona[0]}
            </div>
          )}
          <div className="leading-tight">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {name}
              {sample && (
                <Badge variant="secondary" className="rounded-full font-mono text-[10px] font-medium uppercase tracking-wider">
                  Sample
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex size-1.5">
                <span className="online-ring absolute inset-0 rounded-full bg-success" />
                <span className="relative size-1.5 rounded-full bg-success" />
              </span>
              {persona}, virtual receptionist
            </div>
          </div>
        </div>
        {phone && (
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <a href={`tel:${phone}`} aria-label="Call the clinic">
              <PhoneIcon className="size-4" /> <span className="hidden sm:inline">Call</span>
            </a>
          </Button>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col bg-card lg:m-4 lg:overflow-hidden lg:rounded-[22px] lg:shadow-[0_24px_60px_-36px_rgb(28_25_23/0.35)]">
          <Conversation className="flex-1">
            <ConversationContent className="mx-auto w-full max-w-2xl gap-4 px-4 py-6">
              <AnimatePresence mode="wait" initial={false}>
                {greeted ? (
                  <Enter key="greeting">
                    <Message from="assistant">
                      <MessageContent>
                        <Bubble>
                          Hi, I&apos;m {persona} from {name}. I can book, move or cancel a visit, and answer questions about prices, hours and location.
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </Enter>
                ) : (
                  <motion.div key="typing" exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                    <TypingDots label={`${persona} is typing`} />
                  </motion.div>
                )}
              </AnimatePresence>

              {messages.map((m) => (
                <Enter key={m.id}>
                  <Message from={m.role}>
                    <MessageContent
                      dir="auto"
                      className="group-[.is-user]:rounded-[18px] group-[.is-user]:rounded-br-md group-[.is-user]:bg-primary group-[.is-user]:py-2.5 group-[.is-user]:text-primary-foreground"
                    >
                      {m.parts.map((p, i) =>
                        p.type === "text" ? (
                          m.role === "user" ? (
                            <MessageResponse key={i}>{p.text}</MessageResponse>
                          ) : (
                            <Bubble key={i}>
                              <MessageResponse>{p.text}</MessageResponse>
                            </Bubble>
                          )
                        ) : p.type === "dynamic-tool" ? (
                          <ToolCard key={i} part={p} onPick={send} busy={busy} />
                        ) : null,
                      )}
                    </MessageContent>
                  </Message>
                </Enter>
              ))}
              {status === "submitted" && (
                <Enter>
                  <TypingDots label={`${persona} is typing`} />
                </Enter>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pb-4 pt-2">
            {messages.length === 0 && greeted && (
              <Suggestions>
                {STARTERS.map((s, i) => (
                  <motion.div
                    key={s}
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      ease: EASE_OUT,
                      delay: 0.15 + i * 0.04,
                    }}
                  >
                    <Suggestion suggestion={s} onClick={send} dir="auto" />
                  </motion.div>
                ))}
              </Suggestions>
            )}
            <PromptInput onSubmit={({ text }) => void send(text)} className="[&_[data-slot=input-group]]:rounded-3xl [&_[data-slot=input-group]]:bg-background">
              <PromptInputBody>
                <PromptInputTextarea dir="auto" placeholder={`Message ${persona}…`} rows={1} className="min-h-0 py-3 ps-4" />
              </PromptInputBody>
              <InputGroupAddon align="inline-end">
                <PromptInputSubmit status={status} onStop={stop} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                  {status === "ready" ? <ArrowUpIcon className="size-4" /> : undefined}
                </PromptInputSubmit>
              </InputGroupAddon>
            </PromptInput>
          </div>
        </div>
        <ClinicInfo info={info} phone={phone} />
      </div>
    </div>
  );
}
