import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "MIXLAB — Hip Hop Auto Mixing", description: "ブラウザで完結するヒップホップ制作スタジオ" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
