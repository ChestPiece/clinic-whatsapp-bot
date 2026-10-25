import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Bubble, PatientBubble } from "@/components/chat-cards";
import { HeroConversation, Reveal } from "@/components/landing";
import { Button } from "@/components/ui/button";

// ponytail: "Front Desk" is a placeholder name until the product name is decided (P3).
const DEMO = "/chat/sample-smile";

// One patient's booking, start to finish. Every step is a feature that ships today.
const NIGHT = [
  { when: "Tue 23:40", who: "patient", text: "Hi, anything free Thursday evening?", note: "The clinic is closed. Sara answers anyway, in English or Arabic." },
  { when: "Tue 23:41", who: "sara", text: "Booked: cleaning & polish, Thu 29 Oct at 6:30 pm.", note: "Real free slots from the clinic's hours. Never a double booking." },
  { when: "Wed 18:30", who: "sara", text: "Reminder: your visit is tomorrow at 6:30 pm. Reply 1 to confirm or 2 to change it.", note: "24 hours before, then again 2 hours before." },
  { when: "Wed 18:32", who: "patient", text: "1", note: "Confirmed. One less empty chair." },
] as const;

const SAFETY = [
  { title: "No medical advice", text: "Sara books visits and answers clinic questions. Anything clinical goes to your team." },
  { title: "Emergencies first", text: "Messages like “I can't breathe” get the UAE emergency number, 998, before anything else." },
  { title: "A person when it matters", text: "Sara hands the chat to your staff on WhatsApp and stays quiet while they reply." },
  { title: "No promises on cover", text: "Insurance questions get your list of accepted insurers, never a coverage guarantee." },
];

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M4 13c0-5 3.5-9 8-9s8 4 8 9" stroke="var(--primary)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="12" cy="16" r="4" fill="currentColor" />
    </svg>
  );
}

const label = "font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground";

export default function Home() {
  return (
    <div className="min-h-dvh">
      <section className="relative overflow-hidden">
        <div aria-hidden className="wash" />
        <div aria-hidden className="dots" />
        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
          <span className="flex items-center gap-2 text-[17px] font-bold tracking-tight">
            <Mark className="size-6" /> Front Desk
          </span>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#night" className="hover:text-foreground">How it works</a>
            <a href="#safety" className="hover:text-foreground">Safety</a>
          </nav>
          <Button asChild size="sm" className="rounded-full bg-foreground px-4 text-background hover:bg-foreground/90">
            <Link href={DEMO}>Try the demo</Link>
          </Button>
        </header>

        <div className="relative mx-auto max-w-4xl px-4 pt-14 text-center sm:px-8 sm:pt-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-medium text-accent-foreground">
              <span className="size-1.5 rounded-full bg-primary" /> Answering in English and <span dir="rtl">عربي</span>
            </span>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="mt-7 text-[clamp(2.6rem,7vw,4.4rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-balance">
              Every patient message answered, <span className="text-primary">even at 2&nbsp;a.m.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
              An AI receptionist for dental clinics. It books, moves and cancels visits on WhatsApp and your website.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="h-12 rounded-full px-6 text-base font-semibold">
                <Link href={DEMO}>
                  Try the demo chat <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-12 rounded-full px-5 text-base font-semibold hover:bg-panel">
                <a href="#night">See how it works</a>
              </Button>
            </div>
          </Reveal>
        </div>

        <div className="relative mx-auto mt-16 max-w-6xl px-4 pb-24 sm:mt-20 sm:px-8 sm:pb-28">
          <div aria-hidden className="absolute inset-x-4 bottom-12 top-24 rounded-[36px] bg-gradient-to-b from-card/70 to-panel/80 ring-1 ring-card/60 backdrop-blur-sm sm:inset-x-8" />
          <div className="relative grid items-start gap-6 md:grid-cols-[1fr_400px_1fr]">
            <Reveal delay={0.9} className="mt-40 hidden rounded-2xl bg-card p-4 shadow-[0_20px_40px_-24px_rgb(28_25_23/0.3)] md:block">
              <div className={label}>Reminder · 24 h before</div>
              <p className="mt-2 text-sm">Your visit is tomorrow at 6:30 pm. Reply 1 to confirm or 2 to change it.</p>
              <span className="mt-3 inline-flex rounded-full bg-accent px-2.5 py-1 font-mono text-xs text-accent-foreground">Patient replied “1” ✓</span>
            </Reveal>
            <HeroConversation />
            <Reveal delay={1.3} className="mt-24 hidden rounded-2xl bg-card p-4 shadow-[0_20px_40px_-24px_rgb(28_25_23/0.3)] md:block">
              <div className={label}>Safety</div>
              <p className="mt-2 text-sm">
                “I can&apos;t breathe” gets the UAE emergency number, <b>998</b>, before anything else.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="night" className="border-y bg-card py-28 sm:py-36">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <Reveal>
            <p className={label}>How a booking runs</p>
            <h2 className="mt-4 max-w-xl text-4xl font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-5xl">One patient&apos;s booking, while your desk is closed.</h2>
          </Reveal>
          <ol className="mt-16 flex flex-col">
            {NIGHT.map((s, i) => (
              <li key={s.when}>
                <Reveal delay={i * 0.05} className="grid gap-3 border-t py-7 sm:grid-cols-[7rem_1fr_14rem] sm:items-center sm:gap-8">
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{s.when}</span>
                  <div className="text-sm">{s.who === "patient" ? <PatientBubble>{s.text}</PatientBubble> : <Bubble>{s.text}</Bubble>}</div>
                  <p className="text-sm text-muted-foreground">{s.note}</p>
                </Reveal>
              </li>
            ))}
          </ol>
          <Reveal>
            <p className="mt-10 max-w-xl text-sm text-muted-foreground">
              Didn&apos;t book? One gentle follow-up the next day, naming the next free time. Replying STOP turns follow-ups off.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="safety" className="py-28 sm:py-36">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <p className={label}>Safety</p>
            <h2 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-5xl">
              Careful by design, <span className="text-primary">not by prompt.</span>
            </h2>
            <p className="mt-5 max-w-sm text-muted-foreground">The safety checks are plain code that runs before the AI does, so they hold on every message.</p>
          </Reveal>
          <dl className="grid gap-3 sm:grid-cols-2">
            {SAFETY.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.05} className="rounded-[22px] bg-card p-6">
                <dt className="font-bold">{s.title}</dt>
                <dd className="mt-2 text-muted-foreground">{s.text}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <section className="px-4 pb-6 sm:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-foreground px-6 py-20 text-background sm:px-14 sm:py-24">
          <div aria-hidden className="wash wash-soft" />
          <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
            <Reveal>
              <h2 className="max-w-2xl text-5xl font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-6xl">Let Sara take the night shift.</h2>
            </Reveal>
            <Button asChild size="lg" className="h-12 rounded-full px-6 text-base font-semibold">
              <Link href={DEMO}>
                Chat with Sara <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Mark className="size-5" /> Front Desk
        </span>
        <span>The demo uses a sample clinic and sample data.</span>
      </footer>
    </div>
  );
}
