import type { Metadata } from "next";
import { ReactNode } from "react";

import { AppDataProvider } from "@/components/app-data-provider";
import { AppShell } from "@/components/app-shell";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Le Songe du Lion | Atelier orga GN",
  description: "Base de travail pour creer et organiser un GN en equipe."
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
