import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Fantasy Football",
  description: "Open saved fantasy football seasons, saved leagues, and schedule tools in League Weaver.",
  alternates: { canonical: absoluteUrl("/fantasy") },
};

export default function FantasyPage() {
  redirect("/fantasy/schedules");
}
