import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthModalProvider } from "@/components/account/AuthModalProvider";
import { absoluteUrl, siteUrl } from "@/lib/seo";
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "League Weaver | NFL-style fantasy schedules",
    template: "%s | League Weaver",
  },
  description: "Build an NFL-style fantasy football schedule — seeded off last season, with rivalry weeks and marquee games — and run your season from one commissioner workspace.",
  applicationName: "League Weaver",
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    siteName: "League Weaver",
    title: "League Weaver — NFL-style fantasy football schedules",
    description: "Build structured fantasy football schedules with rivalry weeks, marquee games, standings, exports, and one commissioner workspace.",
    url: absoluteUrl("/"),
    type: "website",
    images: [{ url: "/branding/og-image.jpg", width: 1200, height: 630, alt: "League Weaver fantasy football schedule preview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "League Weaver — NFL-style fantasy football schedules",
    description: "Build structured fantasy football schedules with rivalry weeks, marquee games, standings, exports, and one commissioner workspace.",
    images: ["/branding/og-image.jpg"],
  },
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
