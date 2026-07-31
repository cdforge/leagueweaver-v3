"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { markWelcomed } from "@/lib/welcome";

export function StartBuildingButton({
  href = "/",
  label = "Get started",
  className = "button-primary welcome-cta",
}: {
  href?: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={className} onClick={markWelcomed}>
      {label}
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}
