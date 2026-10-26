import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Staff sign in" };

// What the desk looks like the morning after. Static sample, mirrors the landing story.
const NIGHT = [
  { time: "23:04", name: "Omar M.", text: "Booked a cleaning, Thu 6:30 pm", dot: "bg-primary" },
  { time: "23:41", name: "Sophie R.", text: "Asked which insurers you accept", dot: "bg-web" },
  { time: "01:12", name: "Layla K.", text: "Wants to talk to a person", dot: "bg-alert" },
];

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Link href="/" className="self-start">
          <Logo className="text-xl" />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="text-xs text-muted-foreground">No account? Ask your clinic owner to invite you.</p>
      </div>

      <aside aria-label="Overnight summary, sample" className="hidden border-s bg-card/60 p-10 lg:flex lg:flex-col lg:justify-center xl:p-16">
        <div className="mx-auto w-full max-w-md">
          <p className="text-sm font-medium text-primary">While you were closed</p>
          <h2 className="mt-3 text-h2 font-semibold tracking-[-0.03em] text-balance">Sara kept the desk open.</h2>
          <ol className="mt-10 border-t">
            {NIGHT.map((n) => (
              <li key={n.time} className="grid grid-cols-[3.5rem_1fr] gap-3 border-b py-4 text-sm">
                <span className="font-mono tabular-nums text-muted-foreground">{n.time}</span>
                <span>
                  <span className="flex items-center gap-2 font-medium">
                    <b className={`size-2 rounded-full ${n.dot}`} />
                    {n.name}
                  </span>
                  <span className="mt-0.5 block text-muted-foreground">{n.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs text-muted-foreground">Sample clinic, sample data.</p>
        </div>
      </aside>
    </main>
  );
}
