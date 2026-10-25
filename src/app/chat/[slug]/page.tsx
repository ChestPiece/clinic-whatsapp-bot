import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type CSSProperties } from "react";
import { clinicBySlug, personaName } from "@/lib/clinics";
import { Chat } from "./chat";

export async function generateMetadata({ params }: PageProps<"/chat/[slug]">) {
  await connection(); // clinic lookup reads the clock (5-min cache), so render at request time
  const clinic = await clinicBySlug((await params).slug);
  return { title: clinic ? `Chat with ${clinic.name}` : "Chat" };
}

const HEX = /^#[0-9a-f]{6}$/i; // clinic accent goes into inline CSS, so only plain hex gets through

async function ClinicChat({ params }: { params: PageProps<"/chat/[slug]">["params"] }) {
  await connection();
  const { slug } = await params;
  const clinic = await clinicBySlug(slug);
  if (!clinic?.active) notFound();
  const { accent, logo } = clinic.branding;
  const style = accent && HEX.test(accent) ? ({ "--primary": accent, "--ring": `${accent}8c` } as CSSProperties) : undefined;
  return (
    <div style={style} className="contents">
      <Chat
        slug={slug}
        clinicName={clinic.name}
        persona={personaName(clinic)}
        phone={clinic.phone}
        logo={logo?.startsWith("https://") ? logo : undefined}
        info={{
          hours: clinic.hours,
          services: clinic.services,
          address: clinic.address,
          maps_url: clinic.maps_url,
        }}
      />
    </div>
  );
}

export default function ChatPage({ params }: PageProps<"/chat/[slug]">) {
  return (
    <main className="relative h-dvh overflow-hidden">
      <div aria-hidden className="wash wash-soft" />
      <Suspense fallback={<div className="relative h-full animate-pulse" />}>
        <ClinicChat params={params} />
      </Suspense>
    </main>
  );
}
