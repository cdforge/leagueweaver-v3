import type { Metadata } from "next";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { LoadingPlaybook } from "@/components/ui/LoadingPlaybook";
import { PickemCreatePage } from "@/components/pickem/PickemCreatePage";

export const metadata: Metadata = {
  title: "Create LW Pick'ems | League Weaver",
};

export default function NewPickemPage() {
  return <main className="product-page">
    <AppHeader />
    <Suspense fallback={<section className="product-dashboard page-width"><LoadingPlaybook label="Loading LW Pick'ems setup..." /></section>}>
      <PickemCreatePage />
    </Suspense>
  </main>;
}
