import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { FaqExplorer } from "@/components/faq/FaqExplorer";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Find answers about League Weaver, NFL-style schedule structure, builder steps, workspace tabs, rivalry weeks, ESPN and Sleeper imports, saved leagues, sharing, scores, standings, playoffs, and commissioner tools.",
  alternates: { canonical: absoluteUrl("/faq") },
  openGraph: {
    title: "League Weaver FAQ",
    description: "Answers for fantasy football commissioners using League Weaver to build structured NFL-style schedules, understand every page, share leagues, and manage the season.",
    type: "website",
    images: [{ url: "/branding/og-image.jpg", width: 1200, height: 630, alt: "League Weaver fantasy football schedule preview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "League Weaver FAQ",
    description: "Answers for fantasy football commissioners using League Weaver.",
    images: ["/branding/og-image.jpg"],
  },
};

export default function FaqPage() {
  return (
    <main className="faq-page">
      <AppHeader />
      <section className="faq-hero page-width" aria-labelledby="faq-title">
        <p className="eyebrow">Commissioner Help Center</p>
        <h1 id="faq-title">Answers for ambitious fantasy football commissioners.</h1>
        <p>
          Search League Weaver basics, schedule structure, builder steps, workspace tabs, ESPN and Sleeper imports,
          saved leagues, public sharing, scores, standings, playoffs, exports, and the pages that keep your season organized.
        </p>
      </section>
      <FaqExplorer />
    </main>
  );
}
