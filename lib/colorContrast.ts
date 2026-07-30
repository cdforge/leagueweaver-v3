function channel(value: number) {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const clean = hex.replace("#", "");
  const value = clean.length === 3 ? clean.split("").map((part) => part + part).join("") : clean;
  if (!/^[0-9a-f]{6}$/i.test(value)) return 0;
  const red = channel(parseInt(value.slice(0, 2), 16));
  const green = channel(parseInt(value.slice(2, 4), 16));
  const blue = channel(parseInt(value.slice(4, 6), 16));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function rgb(hex: string) {
  const clean = hex.replace("#", "");
  const value = clean.length === 3 ? clean.split("").map((part) => part + part).join("") : clean;
  if (!/^[0-9a-f]{6}$/i.test(value)) return [17, 122, 69];
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
}

function mixColor(color: string, target: string, amount: number) {
  const from = rgb(color);
  const to = rgb(target);
  const mixed = from.map((value, index) => Math.round(value + (to[index] - value) * amount));
  return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function contrastRatio(first: string, second: string) {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

export function tintColor(color: string, amount = 0.82) {
  const mixed = rgb(color).map((value) => Math.round(value + (255 - value) * amount));
  return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

export function accessibleAccentColor(color: string, background = "#15231C") {
  const backgroundLuminance = luminance(background);
  for (const amount of [0, 0.18, 0.32, 0.46, 0.6, 0.74, 0.84]) {
    const candidate = tintColor(color, amount);
    const candidateLuminance = luminance(candidate);
    const contrast = (Math.max(backgroundLuminance, candidateLuminance) + 0.05) / (Math.min(backgroundLuminance, candidateLuminance) + 0.05);
    if (contrast >= 4.5) return candidate;
  }
  return "#FFFFFF";
}

export function accessibleTeamColor(color: string, background = "#FFFFFF") {
  for (const amount of [0, 0.16, 0.28, 0.4, 0.54, 0.68, 0.82]) {
    const candidate = mixColor(color, "#15231C", amount);
    if (contrastRatio(candidate, background) >= 4.5) return candidate;
  }
  return "#15231C";
}

export function readableTextColor(background: string) {
  const backgroundLuminance = luminance(background);
  const whiteContrast = 1.05 / (backgroundLuminance + 0.05);
  const inkLuminance = luminance("#15231C");
  const inkContrast = (backgroundLuminance + 0.05) / (inkLuminance + 0.05);
  if (Math.max(whiteContrast, inkContrast) >= 4.5) return whiteContrast >= inkContrast ? "#FFFFFF" : "#15231C";
  return "#000000";
}
