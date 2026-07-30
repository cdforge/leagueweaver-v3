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

  const response = await fetch(url, { headers: { Accept: "image/*" }, cache: "no-store" });
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
}
