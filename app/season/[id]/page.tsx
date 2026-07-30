import { Suspense } from "react";
import { SeasonWorkspace } from "@/components/season/SeasonWorkspace";

export default function SeasonPage() {
  return <Suspense fallback={<div className="empty-season"><h1>Loading season…</h1></div>}><SeasonWorkspace /></Suspense>;
}
