import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const archivo = localFont({
  src: "../public/fonts/Archivo-Variable.ttf",
  variable: "--font-archivo",
  display: "swap",
  weight: "100 900",
});

const barlowCondensed = localFont({
  src: [
    { path: "../public/fonts/BarlowCondensed-SemiBold.ttf", weight: "600" },
    { path: "../public/fonts/BarlowCondensed-Bold.ttf", weight: "700" },
  ],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: "League Weaver | Fair fantasy schedules",
  description: "Build a fair fantasy football schedule and run your season from one commissioner workspace.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#117a45",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${archivo.variable} ${barlowCondensed.variable}`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
