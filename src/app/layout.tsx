import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import { cookies } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: {
    default: "Travelhues",
    template: "%s · Travelhues",
  },
  description: "Stories, spots, and day-by-day itineraries.",
  applicationName: "Travelhues",
  appleWebApp: {
    capable: true,
    title: "Travelhues",
    statusBarStyle: "default",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e12e2f",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const jar = await cookies();
  const role = jar.get("th_role")?.value === "tcc" ? "tcc" : "traveler";

  return (
    <html
      lang="en"
      className={`${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <PwaRegister />
        <AppShell role={role}>{children}</AppShell>
      </body>
    </html>
  );
}
