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

export async function analyzeIdentityImage(file: File) {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("The image could not be loaded."));
    element.src = source;
  });

  const previewCanvas = document.createElement("canvas");
  const previewSize = 400;
  const scale = Math.min(1, previewSize / Math.max(image.naturalWidth, image.naturalHeight));
  previewCanvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  previewCanvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const previewContext = previewCanvas.getContext("2d");
  if (!previewContext) throw new Error("Image processing is unavailable.");
  previewContext.drawImage(image, 0, 0, previewCanvas.width, previewCanvas.height);
  const logoUrl = previewCanvas.toDataURL("image/webp", 0.88);

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

  const candidates = [...buckets.values()]
    .sort((left, right) => right.count - left.count)
    .map((bucket) => [
      Math.round(bucket.red / bucket.count),
      Math.round(bucket.green / bucket.count),
      Math.round(bucket.blue / bucket.count),
    ] as [number, number, number]);
  const distinct: Array<[number, number, number]> = [];
  for (const candidate of candidates) {
    if (distinct.every((existing) => colorDistance(existing, candidate) >= 72)) distinct.push(candidate);
    if (distinct.length === 5) break;
  }
  while (distinct.length < 5) distinct.push([17, 122, 69]);

  return {
    logoUrl,
    colors: distinct.map(([red, green, blue]) => toHex(red, green, blue)),
  };
}
