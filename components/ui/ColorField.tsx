"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

// A self-contained custom color control — a saturation/brightness field, a hue slider and a
// validated hex input — replacing the native <input type="color"> (an inconsistent, off-brand
// OS dialog). A hue slider alone can't reach every color (it locks saturation and lightness to
// the starting swatch), so the 2D field gives full control. Color maths are kept local so this
// stays drop-in and dependency-free.

function normalizeHex(value: string): string | null {
  const v = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(v)) return `#${v.toUpperCase()}`;
  if (/^[0-9a-fA-F]{3}$/.test(v)) return `#${v.split("").map((c) => c + c).join("").toUpperCase()}`;
  return null;
}

function hexToRgb(hex: string) {
  const v = hex.replace("#", "");
  return { r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16) };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((n) => Math.round(n).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function rgbToHsv({ r, g, b }: { r: number; g: number; b: number }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function hsvToHex(h: number, s: number, v: number) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function ColorField({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [text, setText] = useState(value.replace(/^#/, "").toUpperCase());
  useEffect(() => {
    const handle = window.setTimeout(() => setText(value.replace(/^#/, "").toUpperCase()), 0);
    return () => window.clearTimeout(handle);
  }, [value]);

  const { h, s, v } = rgbToHsv(hexToRgb(value));
  const hue = Math.round(h);
  const areaRef = useRef<HTMLDivElement>(null);

  const commitHex = (next: string) => {
    setText(next.replace(/^#/, "").toUpperCase());
    const normalized = normalizeHex(next);
    if (normalized) onChange(normalized);
  };

  const applyFromPointer = (clientX: number, clientY: number) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nextS = clamp01((clientX - rect.left) / rect.width);
    const nextV = clamp01(1 - (clientY - rect.top) / rect.height);
    onChange(hsvToHex(hue, nextS, nextV));
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    areaRef.current?.focus();
    applyFromPointer(event.clientX, event.clientY);
    const move = (e: PointerEvent) => applyFromPointer(e.clientX, e.clientY);
    const stop = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", stop);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", stop);
  };

  // Arrow keys nudge saturation (left/right) and brightness (up/down) for keyboard users.
  const nudge = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.1 : 0.02;
    let nextS = s, nextV = v;
    if (event.key === "ArrowLeft") nextS = clamp01(s - step);
    else if (event.key === "ArrowRight") nextS = clamp01(s + step);
    else if (event.key === "ArrowUp") nextV = clamp01(v + step);
    else if (event.key === "ArrowDown") nextV = clamp01(v - step);
    else return;
    event.preventDefault();
    onChange(hsvToHex(hue, nextS, nextV));
  };

  return (
    <div className="color-field">
      <div
        ref={areaRef}
        className="color-field-area"
        style={{ "--sv-base": hsvToHex(hue, 1, 1) } as CSSProperties}
        onPointerDown={startDrag}
        onKeyDown={nudge}
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness"
        aria-valuetext={`Saturation ${Math.round(s * 100)}%, brightness ${Math.round(v * 100)}%`}
      >
        <span className="color-field-area-thumb" style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%`, background: value }} />
      </div>
      <input
        type="range"
        className="color-field-hue"
        min={0}
        max={360}
        value={hue}
        aria-label="Hue"
        onChange={(event) => onChange(hsvToHex(Number(event.target.value), s, v))}
        style={{ "--hue-thumb": value } as CSSProperties}
      />
      <div className="color-field-top">
        <span className="color-field-preview" style={{ background: value }} aria-hidden="true" />
        <span className="color-field-hex">
          <span aria-hidden="true">#</span>
          <input value={text} maxLength={7} spellCheck={false} autoComplete="off" aria-label="Hex color value" onChange={(event) => commitHex(event.target.value)} />
        </span>
      </div>
    </div>
  );
}
