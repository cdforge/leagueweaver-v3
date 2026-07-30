import { gateway } from "@ai-sdk/gateway";
import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { ImportPreview } from "@/lib/types";

const screenshotSchema = z.object({
  leagueName: z.string().optional(),
  teams: z.array(z.object({
    city: z.string().optional(),
    name: z.string().min(1),
    manager: z.string().optional(),
    division: z.string().optional(),
    rank: z.number().int().positive().optional(),
    stadium: z.string().optional(),
    scores: z.array(z.object({ week: z.number().int().positive(), value: z.number().nonnegative() })).optional(),
  })).min(1).max(32),
  warnings: z.array(z.string()).default([]),
});

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.AI_GATEWAY_API_KEY) return NextResponse.json({ error: "Screenshot import is not connected yet. Add AI_GATEWAY_API_KEY to .env.local, then restart the app." }, { status: 503 });
  try {
    const body = await request.json() as { imageDataUrl?: string; seasonYear?: number };
    if (!body.imageDataUrl?.startsWith("data:image/") || body.imageDataUrl.length > 11_000_000) return NextResponse.json({ error: "Choose a valid PNG, JPG, or WebP image under 8 MB." }, { status: 400 });
    const result = await generateText({
      model: gateway(process.env.AI_SCREENSHOT_MODEL || "anthropic/claude-sonnet-5"),
      output: Output.object({ schema: screenshotSchema, name: "fantasy_league_import" }),
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Extract the fantasy league name and each team's separate city, team name, manager, division, prior-season rank, home venue, and any clearly labeled weekly scores. Never guess unreadable text. Add a warning for every uncertain or missing field." },
          { type: "image", image: body.imageDataUrl },
        ],
      }],
    });
    const extracted = result.output;
    const preview: ImportPreview = {
      provider: "screenshot",
      leagueName: extracted.leagueName,
      seasonYear: Number(body.seasonYear) || new Date().getFullYear(),
      teams: extracted.teams.map((team, index) => ({ providerId: `screenshot-${index + 1}`, ...team })),
      hasPriorSeasonRanks: extracted.teams.every((team) => team.rank != null),
      warnings: ["AI-read screenshots can contain mistakes. Review every row before confirming.", ...extracted.warnings],
      requiresConfirmation: true,
    };
    return NextResponse.json(preview);
  } catch {
    return NextResponse.json({ error: "We couldn't read that screenshot. Try a clearer crop with team names and scores fully visible." }, { status: 422 });
  }
}
