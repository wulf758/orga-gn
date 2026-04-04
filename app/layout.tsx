import type { Metadata } from "next";
import { ReactNode } from "react";

import { AppDataProvider } from "@/components/app-data-provider";
import { AppShell } from "@/components/app-shell";

import "@/app/globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://orga-gn.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Atelier Orga GN",
    template: "%s | Atelier Orga GN"
  },
  description:
    "Atelier Orga GN est un outil de preparation et d'organisation de jeu de role grandeur nature pour equipes orga.",
  applicationName: "Atelier Orga GN",
  keywords: [
    "atelier orga gn",
    "organisation gn",
    "outil gn",
    "jeu de role grandeur nature",
    "gestion gn"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Atelier Orga GN",
    title: "Atelier Orga GN",
    description:
      "Outil de preparation et d'organisation de jeu de role grandeur nature pour equipes orga.",
    locale: "fr_FR"
  },
  twitter: {
    card: "summary",
    title: "Atelier Orga GN",
    description:
      "Outil de preparation et d'organisation de jeu de role grandeur nature pour equipes orga."
  }
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr">
      <body>
        <AppDataProvider>
          <AppShell>{children}</AppShell>
        </AppDataProvider>
      </body>
    </html>
  );
}
