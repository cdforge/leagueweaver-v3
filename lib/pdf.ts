import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFImage } from "pdf-lib";
import type { GeneratedSchedule } from "./types";
import { teamDisplayName, teamInitials } from "./teamIdentity";

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return rgb(
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255,
  );
}

function fittedSize(font: PDFFont, text: string, maxWidth: number, preferredSize: number, minSize: number) {
  let size = preferredSize;
  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.25;
  return size;
}

export async function downloadSchedulePdf(schedule: GeneratedSchedule) {
  const [archivoBytes, barlowBytes] = await Promise.all([
    fetch("/fonts/Archivo-Variable.ttf").then((response) => response.arrayBuffer()),
    fetch("/fonts/BarlowCondensed-Bold.ttf").then((response) => response.arrayBuffer()),
  ]);
  const pdfDocument = await PDFDocument.create();
  pdfDocument.registerFontkit(fontkit);
  const bodyFont = await pdfDocument.embedFont(archivoBytes, { subset: true });
  const displayFont = await pdfDocument.embedFont(barlowBytes, { subset: true });
  const green = hexToRgb("#117A45");
  const ink = hexToRgb("#15231C");
  const gray = hexToRgb("#607069");
  const line = hexToRgb("#D8E0DC");
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const display = schedule.setup.display ?? { cityNames: true };
  const logoByTeamId = new Map<string, PDFImage>();

  await Promise.all(schedule.setup.teams.map(async (team) => {
    if (!team.logoUrl) return;
    try {
      const source = team.logoUrl.startsWith("http") ? `/api/image-proxy?url=${encodeURIComponent(team.logoUrl)}` : team.logoUrl;
      const response = await fetch(source);
      const contentType = response.headers.get("content-type") || "";
      const bytes = await response.arrayBuffer();
      const image = contentType.includes("png") || team.logoUrl.includes("image/png")
        ? await pdfDocument.embedPng(bytes)
        : contentType.includes("jpeg") || contentType.includes("jpg") || team.logoUrl.includes("image/jpeg")
          ? await pdfDocument.embedJpg(bytes)
          : null;
      if (image) logoByTeamId.set(team.id, image);
    } catch {
      // Keep exporting even when a remote logo cannot be embedded.
    }
  }));

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 34;
  const contentWidth = pageWidth - margin * 2;
  const centerX = pageWidth / 2;
  const gap = 36;
  const cellWidth = (contentWidth - gap) / 2;
  const awayCellX = margin;
  const homeCellX = centerX + gap / 2;
  const logoSize = 12;
  const textInset = logoSize + 8;
  const teamTextWidth = cellWidth - textInset - 4;
  const rowHeight = 18;

  let page = pdfDocument.addPage([pageWidth, pageHeight]);
  let y = 0;

  const drawBrandHeader = () => {
    const headerLabel = `${schedule.setup.name} · ${schedule.setup.seasonYear}`;
    page.drawRectangle({ x: 0, y: pageHeight - 32, width: pageWidth, height: 32, color: ink });
    page.drawRectangle({ x: margin, y: pageHeight - 23, width: 13, height: 13, color: green });
    page.drawText("LEAGUE WEAVER", { x: margin + 22, y: pageHeight - 23, font: displayFont, size: 13, color: rgb(1, 1, 1) });
    page.drawText(headerLabel, { x: pageWidth - margin - bodyFont.widthOfTextAtSize(headerLabel, 7.5), y: pageHeight - 21, font: bodyFont, size: 7.5, color: rgb(0.84, 0.9, 0.87) });
  };

  const startNewPage = () => {
    page = pdfDocument.addPage([pageWidth, pageHeight]);
    drawBrandHeader();
    y = pageHeight - 62;
  };

  const drawTeam = (teamId: string, name: string, manager: string, cellX: number, baseline: number) => {
    const logo = logoByTeamId.get(teamId);
    const logoX = cellX + 8;
    const logoY = baseline - 3;
    if (logo) {
      const scaled = logo.scale(Math.min(logoSize / logo.width, logoSize / logo.height));
      page.drawImage(logo, { x: logoX + (logoSize - scaled.width) / 2, y: logoY + (logoSize - scaled.height) / 2, width: scaled.width, height: scaled.height });
    } else {
      const team = teamById.get(teamId);
      page.drawRectangle({ x: logoX, y: logoY, width: logoSize, height: logoSize, color: team ? hexToRgb(team.color) : undefined, borderColor: green, borderWidth: 0.45 });
      const initials = team ? teamInitials(team).slice(0, 2).toUpperCase() : "";
      if (initials) page.drawText(initials, { x: logoX + 1.7, y: logoY + 3.2, font: displayFont, size: 5.2, color: rgb(1, 1, 1), maxWidth: logoSize - 2 });
    }
    const textX = cellX + textInset;
    page.drawText(name, { x: textX, y: baseline + 3, font: bodyFont, size: fittedSize(bodyFont, name, teamTextWidth, 7.6, 5.4), color: ink, maxWidth: teamTextWidth });
    if (manager) page.drawText(manager, { x: textX, y: baseline - 5, font: bodyFont, size: fittedSize(bodyFont, manager, teamTextWidth, 5.6, 4.6), color: gray, maxWidth: teamTextWidth });
  };

  const drawWeek = (week: GeneratedSchedule["weeks"][number]) => {
    page.drawRectangle({ x: margin, y: y - 2, width: contentWidth, height: 20, color: rgb(0.95, 0.97, 0.96) });
    page.drawRectangle({ x: margin, y: y - 2, width: 3, height: 20, color: green });
    page.drawText(`NFL Week ${week.weekNumber}`, { x: margin + 10, y: y + 3, font: displayFont, size: 13.5, color: ink });
    page.drawText(week.dateLabel, { x: pageWidth - margin - bodyFont.widthOfTextAtSize(week.dateLabel, 6.5), y: y + 5, font: bodyFont, size: 6.5, color: gray });
    y -= 14;
    page.drawText("AWAY TEAM", { x: awayCellX + textInset, y, font: displayFont, size: 7.5, color: gray });
    page.drawText("HOME TEAM", { x: homeCellX + textInset, y, font: displayFont, size: 7.5, color: gray });
    y -= 12;

    week.games.forEach((game, index) => {
      const awayTeam = teamById.get(game.awayTeamId);
      const homeTeam = teamById.get(game.homeTeamId);
      const away = awayTeam ? teamDisplayName(awayTeam, display.cityNames) : game.awayTeamId;
      const home = homeTeam ? teamDisplayName(homeTeam, display.cityNames) : game.homeTeamId;
      const awayManager = awayTeam?.manager ?? "";
      const homeManager = homeTeam?.manager ?? "";
      if (index % 2 === 0) page.drawRectangle({ x: margin, y: y - 6, width: contentWidth, height: rowHeight, color: rgb(0.985, 0.99, 0.985) });
      drawTeam(game.awayTeamId, away, awayManager, awayCellX, y);
      page.drawText("@", { x: centerX - bodyFont.widthOfTextAtSize("@", 7.5) / 2, y: y + 1, font: bodyFont, size: 7.5, color: gray });
      drawTeam(game.homeTeamId, home, homeManager, homeCellX, y);
      y -= rowHeight;
      page.drawLine({ start: { x: margin, y: y + 9 }, end: { x: pageWidth - margin, y: y + 9 }, thickness: 0.3, color: line });
    });
    y -= 9;
  };

  drawBrandHeader();
  y = pageHeight - 70;
  page.drawText("ESPN schedule entry sheet", { x: margin, y, font: displayFont, size: 28, color: ink });
  y -= 17;
  page.drawText(`${schedule.setup.name} · ${schedule.setup.teams.length} teams · ${schedule.setup.weeks} weeks · Use with ESPN Edit schedule`, { x: margin, y, font: bodyFont, size: 9, color: gray });
  y -= 13;
  page.drawText("Away team shown left. Home team shown right. Manager names appear under each team when available.", { x: margin, y, font: bodyFont, size: 7.2, color: gray });
  y -= 22;

  for (const week of schedule.weeks) {
    const blockHeight = 31 + week.games.length * rowHeight + 9;
    if (y - blockHeight < 34) startNewPage();
    drawWeek(week);
  }

  const pages = pdfDocument.getPages();
  pages.forEach((pdfPage, index) => {
    pdfPage.drawText(`Generated by League Weaver · ESPN entry sheet · Page ${index + 1} of ${pages.length}`, { x: margin, y: 20, font: bodyFont, size: 7, color: gray });
  });
  const bytes = await pdfDocument.save();
  const blob = new Blob([new Uint8Array(bytes).buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${schedule.setup.abbreviation.toLowerCase()}-${schedule.setup.seasonYear}-espn-entry-sheet.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
