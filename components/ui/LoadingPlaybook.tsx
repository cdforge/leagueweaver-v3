"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";

const TIPS = [
  "Checking rivalry weeks for maximum group-chat consequences.",
  "Balancing home and away swings so nobody files a commissioner grievance.",
  "Inspecting bye weeks, division loops, and the usual Week 1 drama.",
  "Keeping saved leagues warm so next season starts with fewer spreadsheets.",
  "Auditing the schedule slate for fairness, chaos, and suspiciously lucky runs.",
  "Sorting team logos, manager names, and all the little commissioner details.",
  "Preparing the recap reel in case this schedule deserves a dramatic reveal.",
  "Looking for repeat matchups before your league chat finds them first.",
  "Checking playoff paths so late-season math feels slightly less cursed.",
  "Sharpening export files for the commissioner who likes receipts.",
  "Reminding the commissioner that fair does not always mean everyone stops complaining.",
  "Preparing evidence for the manager who swears the schedule personally attacked them.",
  "Counting division games twice, because one typo can start a league meeting.",
  "Giving the commissioner one less spreadsheet to pretend they enjoy maintaining.",
  "Checking for schedule drama now, before it becomes a six-paragraph league chat.",
  "Tip: open Team Schedule to see one manager's full path through the season.",
  "Tip: use Copy Sheet to copy your schedule into ESPN or Sleeper, export CSV, or print a handoff sheet.",
  "Tip: Saved Leagues let you reuse teams, colors, logos, divisions, and conferences next season.",
  "Tip: the Playoffs view shows bracket paths, playoff picture, and postseason setup in one place.",
  "Tip: connect ESPN or Sleeper scores when you want weekly results to update faster.",
  "Tip: use the public share page when managers want the schedule without logging in.",
  "Tip: the This Week view is the fastest way to check the current slate.",
  "Tip: standings tiebreakers can be reviewed from a schedule's Settings page.",
];

export function LoadingPlaybook({ label = "Loading fantasy football...", expectedSeconds = 8, compact = false }: { label?: string; expectedSeconds?: number; compact?: boolean }) {
  const [showTip, setShowTip] = useState(false);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const tip = useMemo(() => TIPS[tipIndex], [tipIndex]);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowTip(true), 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsedSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!showTip || TIPS.length < 2) return;
    const timer = window.setInterval(() => {
      setTipIndex((current) => (current + 1) % TIPS.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [showTip]);

  return (
    <div className={`product-loading product-loading-playbook ${compact ? "product-loading-playbook-compact" : ""}`} role="status" aria-live="polite">
      <LoaderCircle className="spin" />
      <span>
        <strong>{label}</strong>
        <em className="loading-playbook-timer">
          {elapsedSeconds < expectedSeconds ? `Usually ready in under ${expectedSeconds} seconds.` : `Still working. ${elapsedSeconds} seconds elapsed.`}
        </em>
        {showTip && <small><Sparkles aria-hidden="true" />{tip}</small>}
      </span>
    </div>
  );
}
