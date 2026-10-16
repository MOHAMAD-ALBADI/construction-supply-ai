import type { Metadata } from "next";

import { DirectionProvider } from "@/components/layout/direction-provider";
import { SyntheticDataBanner } from "@/components/layout/synthetic-data-banner";
import { brand } from "@/config/brand";

// Self-hosted (npm) instead of next/font/google so builds never depend on fetching
// fonts over the network. Arabic + Latin subsets only.
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-700.css";
import "@fontsource/ibm-plex-sans-arabic/latin-400.css";
import "@fontsource/ibm-plex-sans-arabic/latin-500.css";
import "@fontsource/ibm-plex-sans-arabic/latin-600.css";
import "@fontsource/ibm-plex-sans-arabic/latin-700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: brand.nameAr, template: `%s · ${brand.nameAr}` },
  description: brand.taglineAr,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <DirectionProvider>
          <SyntheticDataBanner />
          {children}
        </DirectionProvider>
      </body>
    </html>
  );
}
