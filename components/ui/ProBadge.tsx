import { Crown } from "lucide-react";

type ProBadgeProps = {
  compact?: boolean;
  label?: string;
  className?: string;
};

export function ProBadge({ compact = false, label = "PRO", className = "" }: ProBadgeProps) {
  return (
    <span
      className={["pro-badge", compact ? "compact" : "", className].filter(Boolean).join(" ")}
      aria-label={label === "PRO" ? "Pro feature" : label}
    >
      <Crown aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
