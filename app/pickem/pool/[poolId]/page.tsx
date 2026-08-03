import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { PickemPoolWorkspace } from "@/components/pickem/PickemPoolWorkspace";

export const metadata: Metadata = {
  title: "LW Pick'ems Pool | League Weaver",
};

export default async function PickemPoolPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params;
  return <main className="product-page">
    <AppHeader />
    <PickemPoolWorkspace poolId={poolId} />
  </main>;
}
