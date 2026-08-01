import { NextResponse } from "next/server";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export async function GET(request: Request) {
  const source = new URL(request.url).searchParams.get("url");
  if (!source) return NextResponse.json({ error: "Missing image URL." }, { status: 400 });

  let url: URL;
  try {
    url = new URL(source);
  } catch {
    return NextResponse.json({ error: "Invalid image URL." }, { status: 400 });
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return NextResponse.json({ error: "Only HTTP images can be proxied." }, { status: 400 });
  }

  // Dead hosts, DNS failures, and slow servers are expected for user-supplied logo URLs —
  // catch them (and time out) so a bad logo yields a clean 400 the client can fall back on,
  // never an unhandled 500. A 6s cap keeps a hanging host from stalling the color enrichment.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, { headers: { Accept: "image/*" }, cache: "no-store", signal: controller.signal });
    const contentType = response.headers.get("content-type") || "";
    const contentLength = Number(response.headers.get("content-length") || "0");
    if (!response.ok || !contentType.startsWith("image/")) {
      return NextResponse.json({ error: "That image could not be loaded." }, { status: 400 });
    }
    if (contentLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "That image is too large." }, { status: 413 });
    }

    const body = await response.arrayBuffer();
    if (body.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "That image is too large." }, { status: 413 });
    }

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "That image could not be loaded." }, { status: 400 });
  } finally {
    clearTimeout(timeout);
  }
}
