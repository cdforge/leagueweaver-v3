import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Pro checkout is paused for the MVP release." }, { status: 503 });
}
