import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Fantasy Football | League Weaver",
  description: "Open saved fantasy football seasons, saved leagues, and schedule tools in League Weaver.",
};

export default function FantasyPage() {
  redirect("/fantasy/schedules");
}
