import { formatPoints } from "@/lib/statistics";

export function PointChip({
  value,
  detail,
  label = "PTS",
  className,
}: {
  value: number;
  detail?: string;
  label?: string;
  className?: string;
}) {
  return <span className={["point-chip", className].filter(Boolean).join(" ")}>
    <strong>{formatPoints(value)}</strong>
    <small>{detail ?? label}</small>
  </span>;
}
