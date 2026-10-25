"use client";

// Rich chat cards shared by the live chat (/chat/[slug]) and the landing page demo.
import { CalendarCheckIcon, CheckIcon, ClockIcon, MapPinIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export const dayLabel = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
export const timeLabel = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};

export type Slots = { service: string; days: { date: string; times: string[]; note?: string }[] };
export type Booked = { service: string; date: string; time: string; address: string | null; maps_url: string | null };
export type Appt = { id: string; service: string; date: string; time: string };

// Sara's text bubble: stone on white surfaces; pass bg-card when it sits on stone. The patient's bubble is the sage one.
export const Bubble = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("w-fit max-w-[85%] rounded-[18px] rounded-bl-md bg-background px-4 py-2.5 leading-relaxed", className)}>{children}</div>
);

export const PatientBubble = ({ children }: { children: ReactNode }) => (
  <div className="ml-auto w-fit max-w-[80%] rounded-[18px] rounded-br-md bg-primary px-4 py-2.5 leading-relaxed text-primary-foreground">{children}</div>
);

// "Sara is typing": three dots, like a phone chat.
export function TypingDots({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex w-fit items-center gap-1 rounded-[18px] rounded-bl-md bg-background px-3.5 py-3">
      {[0, 1, 2].map((i) => (
        <span key={i} className="typing-dot size-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 150}ms` }} />
      ))}
    </div>
  );
}

// Free times. Tapping one locks the card: the pick fills, the rest fade, so a second tap can't double-book.
export function SlotPicker({ slots, onPick, busy, picked: pickedProp }: { slots: Slots; onPick: (text: string) => void; busy?: boolean; picked?: string }) {
  const [pickedState, setPicked] = useState<string>();
  const picked = pickedProp ?? pickedState;
  const reduce = useReducedMotion();
  let n = 0;
  return (
    <Card className="w-full max-w-sm gap-3 rounded-2xl py-4 shadow-none">
      <CardHeader className="px-4">
        <CardTitle className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <ClockIcon className="size-3.5" /> Free times · {slots.service}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4">
        {slots.days.map((d) => (
          <div key={d.date} className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold">{dayLabel(d.date)}</span>
            {d.times.length ? (
              <div className="grid grid-cols-3 gap-2">
                {d.times.map((t) => {
                  const key = `${d.date} ${t}`;
                  const isPicked = picked === key;
                  return (
                    <motion.div
                      key={t}
                      initial={reduce ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: picked && !isPicked ? 0.4 : 1, y: 0 }}
                      transition={{ duration: 0.2, ease: EASE_OUT, delay: picked ? 0 : n++ * 0.03 }}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy || !!picked}
                        className={cn(
                          "w-full rounded-xl font-mono text-[13px] font-normal tabular-nums shadow-none hover:border-primary hover:bg-accent",
                          isPicked && "border-foreground bg-foreground text-background disabled:opacity-100",
                        )}
                        onClick={() => {
                          setPicked(key);
                          onPick(`${timeLabel(t)} on ${dayLabel(d.date)} works for me`);
                        }}
                      >
                        {isPicked && <CheckIcon className="size-3.5" />}
                        {timeLabel(t)}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">No free times</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Booking confirmed: settles in once and the check draws itself.
export function BookedCard({ booked: b }: { booked: Booked }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.24, ease: EASE_OUT }}
      className="w-full max-w-sm origin-bottom-left"
    >
      <Card className="gap-3 rounded-2xl py-4 shadow-[0_12px_30px_-18px_rgb(28_25_23/0.35)]">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="flex size-5 items-center justify-center rounded-full bg-success text-success-foreground">
              <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <motion.path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  initial={reduce ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.15 }}
                />
              </svg>
            </span>
            You&apos;re booked
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 px-4 text-sm">
          <div className="font-medium">{b.service}</div>
          <div className="flex items-center gap-1.5 font-mono text-[13px] tabular-nums">
            <CalendarCheckIcon className="size-3.5 text-muted-foreground" />
            {dayLabel(b.date)} at {timeLabel(b.time)}
          </div>
          {b.address && (
            <a className="flex items-start gap-1.5 text-muted-foreground underline-offset-4 hover:underline" href={b.maps_url ?? undefined} target="_blank" rel="noreferrer">
              <MapPinIcon className="mt-0.5 size-3.5 shrink-0" /> {b.address}
            </a>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function AppointmentList({ appts }: { appts: Appt[] }) {
  return (
    <Card className="w-full max-w-sm gap-2 rounded-2xl py-4 shadow-none">
      <CardContent className="flex flex-col gap-2 px-4 text-sm">
        {appts.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-2">
            <span>{a.service}</span>
            <Badge variant="secondary" className="font-mono font-normal tabular-nums">
              {dayLabel(a.date)}, {timeLabel(a.time)}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
