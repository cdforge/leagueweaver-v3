"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasBeenWelcomed, markWelcomed } from "@/lib/welcome";
import { loadSetup } from "@/lib/storage";

/**
 * Sends genuinely first-time visitors from the builder to the intro.
 * Anyone who has already been welcomed, has a saved draft, or arrives to
 * import a league (`?import=`) drops straight into the wizard.
 */
export function WelcomeGate() {
  const router = useRouter();
  useEffect(() => {
    if (hasBeenWelcomed()) return;
    const importing = new URLSearchParams(window.location.search).has("import");
    if (importing || loadSetup()) {
      markWelcomed();
      return;
    }
    router.replace("/");
  }, [router]);
  return null;
}
