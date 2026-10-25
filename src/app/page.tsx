import { ArrowRightIcon, CalendarCheckIcon, LanguagesIcon, LayoutDashboardIcon, MessageCircleIcon, ShieldCheckIcon, SirenIcon, StethoscopeIcon, UserRoundIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { HeroConversation, Reveal } from "@/components/landing";
import { ThemeToggle, WeekCalendar, type Block } from "@/components/ledger";
import { Button } from "@/components/ui/button";

// ponytail: "Front Desk" is a placeholder name until the product name is decided (P3).
const DEMO = "/chat/sample-smile";

const SAFETY = [
  { title: "No medical advice", text: "Sara books visits and answers clinic questions. Anything clinical goes to your team." },
  { title: "Emergencies first", text: "Messages like “I can't breathe” get the UAE emergency number, 998, before anything else." },
  { title: "A person when it matters", text: "Sara hands the chat to your staff on WhatsApp and stays quiet while they reply." },
  { title: "No promises on cover", text: "Insurance questions get your list of accepted insurers, never a coverage guarantee." },
];

// Sample week for the desk preview (UAE week starts Saturday). No real patients.
const DAYS = [
  { label: "Sat", date: 24 },
  { label: "Sun", date: 25 },
  { label: "Mon", date: 26 },
  { label: "Tue", date: 27, today: true },
  { label: "Wed", date: 28 },
  { label: "Thu", date: 29 },
];
const BLOCKS: Block[] = [
  { id: "1", day: 0, start: 9.5, end: 10.5, title: "Check-up", name: "Omar M.", kind: "wa" },
  { id: "2", day: 1, start: 11, end: 11.75, title: "Cleaning", name: "Sophie R.", kind: "web" },
  { id: "3", day: 0, start: 14, end: 15.5, title: "Root canal", name: "Ahmed K.", kind: "wa" },
  { id: "4", day: 2, start: 10, end: 11, title: "Kids visit", name: "Mira S.", kind: "web" },
  { id: "5", day: 4, start: 16, end: 17, title: "Lost crown", name: "Nadia P.", kind: "staff" },
  { id: "6", day: 2, start: 15, end: 15.75, title: "Cleaning", name: "Hassan A.", kind: "wa" },
  { id: "7", day: 3, start: 12, end: 12.75, title: "Cleaning", name: "Rania T.", kind: "wa" },
  { id: "8", day: 5, start: 18.5, end: 19.5, title: "Cleaning", name: "Layla H.", kind: "wa" },
];

const FEATURES = [
  { icon: CalendarCheckIcon, title: "Books real free times", text: "Sara reads your clinic hours and offers only open slots. She books, moves and cancels visits, and never double books." },
  { icon: LanguagesIcon, title: "English and Arabic", text: "Patients write the way they talk, in English, Arabic or Arabizi. Sara answers in the same language." },
  { icon: MessageCircleIcon, title: "WhatsApp and your website", text: "One receptionist for both channels. Every chat and booking lands in the same staff inbox." },
];

const STEPS = [
  { title: "A patient messages", text: "At 11 pm on a Tuesday: “anything free Thursday evening?” The clinic is closed. Sara answers." },
  { title: "Sara offers real slots", text: "Free times from your book, a tap to pick one, and a booking card with the address." },
  { title: "Reminders do the rest", text: "A reminder 24 hours and 2 hours before. Reply 1 to confirm or 2 to change it." },
];

const SAFETY_ICONS = [StethoscopeIcon, SirenIcon, UserRoundIcon, ShieldCheckIcon];

const Container = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className ?? ""}`}>{children}</div>;

const Heading = ({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) => (
  <div className="max-w-2xl">
    <p className="text-sm font-medium text-primary">{eyebrow}</p>
    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
    {text && <p className="mt-4 text-pretty text-muted-foreground">{text}</p>}
  </div>
);

export default function Home() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 px-4 pt-3 sm:px-6">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl border bg-card/80 ps-4 pe-2 shadow-sm backdrop-blur-md">
          <Link href="/" aria-label="Front Desk home">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {[
              ["#features", "Features"],
              ["#how", "How it works"],
              ["#safety", "Safety"],
            ].map(([href, text]) => (
              <a key={href} href={href} className="hidden rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:inline">
                {text}
              </a>
            ))}
            <span aria-hidden className="mx-2 hidden h-5 w-px bg-border md:block" />
            <Link href="/login" className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              Sign in
            </Link>
            <Button asChild size="sm" className="ms-1 hidden h-9 rounded-xl px-4 sm:inline-flex">
              <Link href={DEMO}>
                Try the demo <ArrowRightIcon className="size-3.5" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <Container className="grid items-center gap-12 pb-16 pt-12 sm:pb-20 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" /> For dental clinics in the UAE
          </p>
          <h1 className="mt-6 max-w-[18ch] text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-balance sm:text-5xl lg:text-[3.5rem]">An AI receptionist that books patients around the clock.</h1>
          <p className="mt-5 max-w-[46ch] text-lg text-pretty text-muted-foreground">
            Sara answers on WhatsApp and your website, in English and <span dir="rtl">عربي</span>. She books, moves and cancels visits, and sends the reminders.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={DEMO}>
                Try the demo chat <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-card">
              <a href="#how">See how it works</a>
            </Button>
          </div>
        </Reveal>
        <HeroConversation />
      </Container>

      <section id="features" className="border-t bg-card/50 py-20">
        <Container>
          <Heading eyebrow="Features" title="Everything your front desk does after hours." />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.05} className="rounded-xl border bg-card p-6">
                <f.icon className="size-5 text-primary" />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">{f.text}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-4 grid gap-6 rounded-xl border bg-card p-6 lg:grid-cols-[18rem_1fr] lg:items-center">
            <div>
              <LayoutDashboardIcon className="size-5 text-primary" />
              <h3 className="mt-4 font-semibold">Your staff see the week, not a chat feed</h3>
              <p className="mt-2 text-sm text-pretty text-muted-foreground">Each booking lands on the calendar. Chats that need a person show up red, so nothing waits.</p>
            </div>
            <WeekCalendar title="Week of 24 October" days={DAYS} blocks={BLOCKS} to={20} now={{ day: 3, hour: 13.4 }} />
          </Reveal>
        </Container>
      </section>

      <section id="how" className="border-t py-20">
        <Container>
          <Heading eyebrow="How it works" title="One booking, while your desk is closed." />
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.05} className="rounded-xl border bg-card p-6">
                <span className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{i + 1}</span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">{s.text}</p>
              </Reveal>
            ))}
          </ol>
          <p className="mt-6 text-sm text-muted-foreground">No booking? One gentle follow-up the next day. Replying STOP turns follow-ups off.</p>
        </Container>
      </section>

      <section id="safety" className="border-t bg-card/50 py-20">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <Heading eyebrow="Safety" title="Careful by design." text="The safety checks are plain code that runs before the AI does, so they hold on every message." />
          <dl className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
            {SAFETY.map((s, i) => {
              const Icon = SAFETY_ICONS[i];
              return (
                <div key={s.title} className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card">
                    <Icon className="size-4 text-primary" />
                  </span>
                  <div>
                    <dt className="font-semibold">{s.title}</dt>
                    <dd className="mt-1 text-sm text-pretty text-muted-foreground">{s.text}</dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </Container>
      </section>

      <section className="border-t py-20">
        <Container>
          <div className="flex flex-col items-start gap-6 rounded-2xl bg-primary px-8 py-12 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">See Sara book a visit.</h2>
              <p className="mt-2 opacity-80">The demo runs on a sample clinic. Try it in English or Arabic.</p>
            </div>
            <Button asChild size="lg" variant="secondary">
              <Link href={DEMO}>
                Open the demo chat <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      <footer className="border-t">
        <Container className="flex flex-col gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Logo className="text-xl text-foreground" />
          <span className="flex items-center gap-3">
            The demo uses a sample clinic and sample data.
            <ThemeToggle />
          </span>
        </Container>
      </footer>
    </div>
  );
}
