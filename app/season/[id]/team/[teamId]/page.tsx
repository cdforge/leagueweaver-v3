import { Suspense } from "react";
import { SeasonWorkspace } from "@/components/season/SeasonWorkspace";

export default function TeamPage() {
  return <Suspense fallback={<div className="empty-season"><h1>Loading team schedule…</h1></div>}><SeasonWorkspace initialView="team-schedule" /></Suspense>;
}
