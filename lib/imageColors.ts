function componentToHex(value: number) {
  return Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
}

function toHex(red: number, green: number, blue: number) {
  return `#${componentToHex(red)}${componentToHex(green)}${componentToHex(blue)}`.toUpperCase();
}

function colorDistance(left: [number, number, number], right: [number, number, number]) {
  return Math.sqrt(
    (left[0] - right[0]) ** 2 +
    (left[1] - right[1]) ** 2 +
    (left[2] - right[2]) ** 2,
  );
}

// 0 for pure gray, up to 1 for a fully saturated color. Used to bias the auto-pick toward
// a logo's vivid "brand" color without excluding gray outright.
function chroma([red, green, blue]: [number, number, number]) {
  return (Math.max(red, green, blue) - Math.min(red, green, blue)) / 255;
}

type PaletteCandidate = { rgb: [number, number, number]; count: number };

// Fallback used only when a logo yields no usable color (all white/black/transparent).
const FALLBACK_COLOR = "#117A45";

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const element = new Image();
    // Remote logos are served back through our own /api/image-proxy, so this stays a
    // same-origin load and the canvas is never tainted — getImageData keeps working.
    element.crossOrigin = "anonymous";
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("The image could not be loaded."));
    element.src = source;
  });
}

// Quantize an image into a small, well-spread palette. Skips transparent and
// near-white/near-black pixels. The first entry is the auto-pick — frequency weighted by
// chroma so a vivid brand color can beat a slightly-more-common gray (a dominant gray still
// wins, so gray is never excluded). The remaining swatches are chosen by farthest-point
// sampling so the set stays visibly distinct. Returns up to `max` hex strings, never padded.
function extractPalette(image: HTMLImageElement, max = 5): string[] {
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = 64;
  sampleCanvas.height = 64;
  const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Color analysis is unavailable.");
  context.drawImage(image, 0, 0, 64, 64);
  const pixels = context.getImageData(0, 0, 64, 64).data;
  const buckets = new Map<string, { count: number; red: number; green: number; blue: number }>();

  for (let index = 0; index < pixels.length; index += 16) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const alpha = pixels[index + 3];
    if (alpha < 160) continue;
    const brightness = (red + green + blue) / 3;
    if (brightness > 244 || brightness < 18) continue;
    const qr = Math.round(red / 32) * 32;
    const qg = Math.round(green / 32) * 32;
    const qb = Math.round(blue / 32) * 32;
    const key = `${qr}-${qg}-${qb}`;
    const bucket = buckets.get(key) ?? { count: 0, red: 0, green: 0, blue: 0 };
    bucket.count += 1;
    bucket.red += red;
    bucket.green += green;
    bucket.blue += blue;
    buckets.set(key, bucket);
  }

  const candidates: PaletteCandidate[] = [...buckets.values()]
    .map((bucket) => ({
      rgb: [
        Math.round(bucket.red / bucket.count),
        Math.round(bucket.green / bucket.count),
        Math.round(bucket.blue / bucket.count),
      ] as [number, number, number],
      count: bucket.count,
    }))
    .sort((left, right) => right.count - left.count);
  if (!candidates.length) return [];

  // Only ever choose from the most common colors so a stray pixel can't become a swatch.
  const pool = candidates.slice(0, 30);

  // Auto-pick: frequency boosted by chroma. Gray (chroma 0) is scored on frequency alone, so
  // it can still win when it truly dominates — it's biased against, not eliminated.
  const score = ({ rgb, count }: PaletteCandidate) => count * (1 + 4 * chroma(rgb));
  const best = pool.reduce((winner, candidate) => (score(candidate) > score(winner) ? candidate : winner));

  // Fill the rest by farthest-point sampling: each new swatch is the pool color most distant
  // from everything already chosen, so the five stay dispersed instead of near-duplicates.
  const selected: PaletteCandidate[] = [best];
  while (selected.length < max) {
    let pick: PaletteCandidate | null = null;
    let pickSpread = -1;
    for (const candidate of pool) {
      if (selected.includes(candidate)) continue;
      const spread = Math.min(...selected.map((chosen) => colorDistance(chosen.rgb, candidate.rgb)));
      if (spread > pickSpread) { pickSpread = spread; pick = candidate; }
    }
    if (!pick || pickSpread < 60) break;
    selected.push(pick);
  }
  return selected.map(({ rgb }) => toHex(rgb[0], rgb[1], rgb[2]));
}

export async function analyzeIdentityImage(file: File) {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.readAsDataURL(file);
  });

  const image = await loadImage(source);

  const previewCanvas = document.createElement("canvas");
  const previewSize = 400;
  const scale = Math.min(1, previewSize / Math.max(image.naturalWidth, image.naturalHeight));
  previewCanvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  previewCanvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const previewContext = previewCanvas.getContext("2d");
  if (!previewContext) throw new Error("Image processing is unavailable.");
  previewContext.drawImage(image, 0, 0, previewCanvas.width, previewCanvas.height);
  const logoUrl = previewCanvas.toDataURL("image/webp", 0.88);

  const colors = extractPalette(image);
  return {
    logoUrl,
    colors: colors.length ? colors : [FALLBACK_COLOR],
  };
}

// Pull the dominant colors out of a logo that already lives at a URL — e.g. an ESPN or
// Sleeper team logo surfaced during import. Remote (http) logos are routed through the
// same-origin image proxy so the canvas stays readable. Returns [] if the logo can't be
// read, so callers can fall back to a default rather than showing a wrong color.
export async function extractLogoColors(logoUrl: string): Promise<string[]> {
  try {
    const source = logoUrl.startsWith("http") ? `/api/image-proxy?url=${encodeURIComponent(logoUrl)}` : logoUrl;
    const image = await loadImage(source);
    return extractPalette(image);
  } catch {
    return [];
  }
}
