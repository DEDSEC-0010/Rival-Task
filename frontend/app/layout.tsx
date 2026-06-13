import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Tasks",
  description: "A focused task management app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-[100dvh]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
