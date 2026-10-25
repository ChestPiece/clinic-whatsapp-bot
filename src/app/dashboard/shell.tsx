"use client";

import { CalendarDaysIcon, InboxIcon, LayoutListIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabaseBrowser } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard", label: "Today", icon: LayoutListIcon },
  { href: "/dashboard/inbox", label: "Inbox", icon: InboxIcon },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDaysIcon },
  { href: "/dashboard/patients", label: "Patients", icon: UsersIcon },
];

export function Nav({ needsStaff }: { needsStaff: number }) {
  const path = usePathname();
  return (
    <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto md:flex-col">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-10 shrink-0 items-center gap-2.5 rounded-[4px] px-3 text-sm text-muted-foreground transition-colors hover:bg-rule hover:text-foreground",
              active && "bg-card text-foreground shadow-[var(--shadow-slip)] ring-1 ring-border",
            )}
          >
            <Icon className="size-4" />
            {label}
            {href === "/dashboard/inbox" && needsStaff > 0 && (
              <span className="ms-auto rounded-full bg-alert px-1.5 font-mono text-[11px] tabular-nums text-white">{needsStaff}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// Re-renders the page when this clinic's chats, visits or pauses change. RLS limits what Realtime sends.
export function Live({ clinicId }: { clinicId: string }) {
  const router = useRouter();
  useEffect(() => {
    const sb = supabaseBrowser();
    let t: ReturnType<typeof setTimeout> | undefined;
    const soon = () => {
      clearTimeout(t);
      t = setTimeout(() => router.refresh(), 300);
    };
    const channel = sb
      .channel(`desk-${clinicId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `clinic_id=eq.${clinicId}` }, soon)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `clinic_id=eq.${clinicId}` }, soon)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, soon)
      .subscribe();
    return () => {
      clearTimeout(t);
      sb.removeChannel(channel);
    };
  }, [clinicId, router]);
  return null;
}
