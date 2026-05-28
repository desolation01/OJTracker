import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import { AppProviders } from "@/components/layout/AppProviders";
import { PWARegister } from "@/components/pwa/PWARegister";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "OJTracker",
  description: "OJT Hours Tracking System",
  applicationName: "OJTracker",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OJTracker",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrains.variable} font-body antialiased`}>
        <AppProviders>{children}</AppProviders>
        <PWARegister />
      </body>
    </html>
  );
}
