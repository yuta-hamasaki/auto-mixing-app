import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "./i18n";

export const metadata: Metadata = { title: "MIXLAB — Hip Hop Auto Mixing", description: "A browser-based hip-hop mixing and DJ studio." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body><I18nProvider>{children}</I18nProvider></body></html>;
}
