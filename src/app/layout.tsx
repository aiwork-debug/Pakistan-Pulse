import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import type { ReactNode } from "react";
import { DemoBanner } from "@/components/ui/demo-banner";
import { SITE_URL } from "@/lib/format";
import { focusRing } from "@/lib/ui";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pulse | Independent News",
    template: "%s | Pulse",
  },
  description:
    "Pulse is an independent platform for news and long-form reporting on the economy, cities, technology, environment, education, and sport.",
  applicationName: "Pulse",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body className="bg-paper font-sans text-ink antialiased">
        <a
          href="#main-content"
          className={`sr-only rounded-md bg-primary px-4 py-2 text-sm font-semibold text-paper focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] ${focusRing}`}
        >
          Skip to content
        </a>
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
