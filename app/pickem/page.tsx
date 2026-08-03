import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { PickemDashboard } from "@/components/pickem/PickemDashboard";

export const metadata: Metadata = {
  title: "LW Pick'ems | League Weaver",
  description: "Create, open, and manage League Weaver Pick'ems pools.",
};

export default function PickemPage() {
  return <main className="product-page">
    <AppHeader />
    <PickemDashboard />
  </main>;
}
