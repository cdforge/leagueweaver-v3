"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { listLocalSeasons } from "@/lib/storage";

export function MySchedulesButton() {
  const [href, setHref] = useState("/account?next=/fantasy/schedules");
  const [label, setLabel] = useState("Sign in for schedules");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const hasLocalSchedules = listLocalSeasons().length > 0;
      let signedIn = false;
      try {
        const { data } = await createClient()?.auth.getUser() ?? { data: { user: null } };
        signedIn = Boolean(data.user);
      } catch {
        signedIn = false;
      }
      if (!active) return;
      if (signedIn || hasLocalSchedules) {
        setHref("/fantasy/schedules");
        setLabel("My schedules");
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  return <Link className="button-secondary" href={href}><CalendarDays />{label}</Link>;
}
