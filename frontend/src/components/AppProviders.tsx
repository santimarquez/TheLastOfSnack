"use client";

import { LocaleProvider } from "@/i18n/context";
import { PageTransition } from "@/components/PageTransition";
import { BackgroundMusic } from "@/components/BackgroundMusic";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <BackgroundMusic />
      <PageTransition>{children}</PageTransition>
    </LocaleProvider>
  );
}
