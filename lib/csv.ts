import type { GeneratedSchedule } from "./types";
import { teamDisplayName } from "./teamIdentity";

function cell(value: string | number | undefined) {
  let text = String(value ?? "");
  // #18.1 — neutralize CSV/formula injection: a cell beginning with = + - @ (or a
  // tab/CR) is executed as a formula by Excel/Sheets on open, so a team or manager
  // named `=HYPERLINK(...)` would run. Prefix with an apostrophe so it renders inert.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function scheduleToCsv(schedule: GeneratedSchedule) {
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const display = schedule.setup.display ?? { cityNames: true, managers: true, venues: true };
  const rows = [["Week", "Dates", "Away", "Home", ...(display.venues ? ["Stadium"] : []), "Type", "Away score", "Home score"]];
  for (const week of schedule.weeks) {
    for (const game of week.games) {
      rows.push([
        String(week.weekNumber),
        week.dateLabel,
        teamById.has(game.awayTeamId) ? teamDisplayName(teamById.get(game.awayTeamId)!, display.cityNames) : game.awayTeamId,
        teamById.has(game.homeTeamId) ? teamDisplayName(teamById.get(game.homeTeamId)!, display.cityNames) : game.homeTeamId,
        ...(display.venues ? [game.stadium] : []),
        game.matchupType,
        game.awayScore == null ? "" : String(game.awayScore),
        game.homeScore == null ? "" : String(game.homeScore),
      ]);
    }
  }
  return rows.map((row) => row.map(cell).join(",")).join("\n");
}

export function downloadCsv(schedule: GeneratedSchedule) {
  const blob = new Blob([scheduleToCsv(schedule)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${schedule.setup.abbreviation.toLowerCase()}-${schedule.setup.seasonYear}-schedule.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
