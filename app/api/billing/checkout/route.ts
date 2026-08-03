import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Checkout is paused for the MVP release." }, { status: 503 });
}
