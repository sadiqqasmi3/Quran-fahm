import "@fontsource-variable/atkinson-hyperlegible-next";
import "@fontsource-variable/noto-naskh-arabic";
import "@fontsource/amiri-quran";
import "@fontsource/noto-nastaliq-urdu";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { ThemeHydrator } from "@/components/theme-hydrator";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Quran Feham",
    template: "%s · Quran Feham",
  },
  description: "A personal Quran comprehension, reading, recitation, and family-learning platform.",
  applicationName: "Quran Feham",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f4ec",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-theme="light" data-scroll-behavior="smooth">
      <body>
        <ThemeHydrator />
        <ServiceWorkerRegistration />
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-hero px-4 py-3 text-sm font-semibold text-on-hero transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
