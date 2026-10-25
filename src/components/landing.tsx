"use client";

// Client pieces of the landing page: the scripted hero conversation and scroll reveals.
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { BookedCard, Bubble, EASE_OUT, PatientBubble, SlotPicker, TypingDots } from "@/components/chat-cards";

// Sample data only: no real clinic or patient.
const SLOTS = { service: "Cleaning & polish", days: [{ date: "2026-10-29", times: ["17:00", "18:30", "19:15"] }] };
const BOOKED = { service: "Cleaning & polish", date: "2026-10-29", time: "18:30", address: "Sample Smile Dental, Jumeirah", maps_url: null };

// Beat times in ms. Each beat reveals one more line of the conversation.
const BEATS = [400, 1100, 2100, 3600, 4300, 5300, 6600, 7300, 8200];

export function HeroConversation() {
  const reduce = useReducedMotion();
  const [at, setStep] = useState(0);

  useEffect(() => {
    // Reduced motion jumps to the end. Done here, not in render, so server and client HTML match.
    const timers = BEATS.map((ms, i) => setTimeout(() => setStep(i + 1), reduce ? 0 : ms));
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  const typing = at === 2 || at === 5 || at === 8;

  return (
    <figure className="drift relative mx-auto w-full max-w-[400px]">
      <div className="overflow-hidden rounded-[28px] bg-card ring-1 ring-border shadow-[0_40px_80px_-40px_rgb(28_25_23/0.4)]">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <div aria-hidden className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">S</div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Sample Smile Dental</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex size-1.5">
                <span className="online-ring absolute inset-0 rounded-full bg-success" />
                <span className="relative size-1.5 rounded-full bg-success" />
              </span>
              Sara, virtual receptionist
            </div>
          </div>
          <span className="ms-auto font-mono text-xs tabular-nums text-muted-foreground">23:40</span>
        </div>

        {/* Decorative replay of a real flow; inert so keyboard users skip it. */}
        <div inert className="flex h-[470px] flex-col justify-end gap-3 overflow-hidden p-4 text-sm [mask-image:linear-gradient(to_bottom,transparent,black_24px)]">
          <AnimatePresence initial={false}>
            {at >= 1 && (
              <Line key="p1">
                <PatientBubble>Hi, can I book a cleaning this week? Evenings are best</PatientBubble>
              </Line>
            )}
            {at >= 3 && (
              <Line key="s1">
                <div className="flex flex-col gap-2">
                  <Bubble>Of course. These evening times are free on Thursday:</Bubble>
                  <SlotPicker slots={SLOTS} onPick={() => {}} picked={at >= 4 ? "2026-10-29 18:30" : undefined} />
                </div>
              </Line>
            )}
            {at >= 4 && (
              <Line key="p2">
                <PatientBubble>6:30 pm on Thu 29 Oct works for me</PatientBubble>
              </Line>
            )}
            {at >= 6 && (
              <Line key="s2">
                <BookedCard booked={BOOKED} />
              </Line>
            )}
            {at >= 7 && (
              <Line key="p3">
                <PatientBubble>
                  <span dir="rtl">شكراً، تمام</span>
                </PatientBubble>
              </Line>
            )}
            {at >= 9 && (
              <Line key="s3">
                <Bubble>
                  <span dir="rtl">العفو! نشوفك الخميس الساعة ٦:٣٠ مساءً.</span>
                </Bubble>
              </Line>
            )}
            {typing && (
              <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
                <TypingDots label="Sara is typing" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted-foreground">Sample conversation, replayed</figcaption>
    </figure>
  );
}

function Line({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: EASE_OUT }}>
      {children}
    </motion.div>
  );
}

// Fades a block up once when it scrolls into view.
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }} // same on server and client; reduced motion only zeroes the duration
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -10% 0px" }}
      transition={reduce ? { duration: 0 } : { duration: 0.4, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}
