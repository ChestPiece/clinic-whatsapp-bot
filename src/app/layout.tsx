import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Readex_Pro } from "next/font/google";
import "./globals.css";

// Latin first in the sans stack (globals.css): Manrope has no Arabic glyphs, so Arabic falls through to Readex Pro.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const readex = Readex_Pro({
  variable: "--font-readex",
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "AI Front Desk",
  description: "AI receptionist for dental clinics: WhatsApp and website chat.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${readex.variable} ${plexMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
