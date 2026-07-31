import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthModalProvider } from "@/components/account/AuthModalProvider";
import "./globals.css";

const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "League Weaver | NFL-style fantasy schedules",
  description: "Build an NFL-style fantasy football schedule — seeded off last season, with rivalry weeks and marquee games — and run your season from one commissioner workspace.",
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
        <AuthModalProvider>{children}</AuthModalProvider>
        {adsenseClientId && (
          <Script
            id="adsbygoogle-init"
            strategy="afterInteractive"
            async
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
          />
        )}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
