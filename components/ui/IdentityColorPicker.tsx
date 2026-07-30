"use client";

import { type MouseEvent, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ImagePlus, LoaderCircle, Palette, Pipette, X } from "lucide-react";
import { analyzeIdentityImage } from "@/lib/imageColors";
import { readableTextColor, tintColor } from "@/lib/colorContrast";
import { Tooltip } from "./Tooltip";

const EMPTY_COLOR_SUGGESTIONS: string[] = [];
const IDENTITY_COLOR_MENU_EVENT = "leagueweaver:identity-color-menu-open";

export function IdentityColorPicker({
  name,
  abbreviation,
  color,
  logoUrl,
  colorSuggestions = EMPTY_COLOR_SUGGESTIONS,
  onChange,
  compact = false,
  showColorControl = true,
  showAbbreviation = true,
  imagePresentation = "tinted",
}: {
  name: string;
  abbreviation: string;
  color: string;
  logoUrl?: string;
  colorSuggestions?: string[];
  onChange: (next: { color?: string; logoUrl?: string }) => void;
  compact?: boolean;
  showColorControl?: boolean;
  showAbbreviation?: boolean;
  imagePresentation?: "tinted" | "bare";
}) {
  const inputId = useId();
  const menuId = useId();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [draftColor, setDraftColor] = useState(color);
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [pickMode, setPickMode] = useState(false);
  const [pickerError, setPickerError] = useState("");
  const paletteRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visibleLogo = logoUrl && failedLogo !== logoUrl ? logoUrl : undefined;
  useEffect(() => {
    setSuggestions(colorSuggestions);
  }, [colorSuggestions]);
  useEffect(() => {
    if (open) setDraftColor(color);
  }, [color, open]);
  useEffect(() => {
    const closeOtherMenu = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (detail?.id !== menuId) setOpen(false);
    };
    window.addEventListener(IDENTITY_COLOR_MENU_EVENT, closeOtherMenu);
    return () => window.removeEventListener(IDENTITY_COLOR_MENU_EVENT, closeOtherMenu);
  }, [menuId]);
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const analyzed = await analyzeIdentityImage(file);
      if (showColorControl) setSuggestions(analyzed.colors);
      onChange({ logoUrl: analyzed.logoUrl, color: analyzed.colors[0] });
      if (showColorControl) {
        window.dispatchEvent(new CustomEvent(IDENTITY_COLOR_MENU_EVENT, { detail: { id: menuId } }));
        setOpen(true);
      }
    } finally {
      setBusy(false);
    }
  };
  useLayoutEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = paletteRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = menuRef.current?.offsetWidth || 326;
      const menuHeight = menuRef.current?.offsetHeight || 360;
      const maxLeft = Math.max(12, window.innerWidth - menuWidth - 12);
      const maxTop = Math.max(12, window.innerHeight - menuHeight - 12);
      const belowTop = rect.bottom + 7;
      const aboveTop = rect.top - menuHeight - 7;
      setMenuPosition({
        top: Math.max(12, Math.min(maxTop, belowTop <= maxTop ? belowTop : aboveTop)),
        left: Math.max(12, Math.min(maxLeft, rect.left)),
      });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, pickMode, suggestions.length]);

  useEffect(() => {
    if (!open || !pickMode || !visibleLogo) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !context) return;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const width = 260;
      const height = 180;
      const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = Math.max(1, Math.round(image.naturalWidth * scale));
      const drawHeight = Math.max(1, Math.round(image.naturalHeight * scale));
      const offsetX = Math.round((width - drawWidth) / 2);
      const offsetY = Math.round((height - drawHeight) / 2);
      canvas.width = width;
      canvas.height = height;
      canvas.dataset.offsetX = String(offsetX);
      canvas.dataset.offsetY = String(offsetY);
      canvas.dataset.drawWidth = String(drawWidth);
      canvas.dataset.drawHeight = String(drawHeight);
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
      setPickerError("");
    };
    image.onerror = () => setPickerError("This logo could not be opened for color picking.");
    image.src = visibleLogo.startsWith("http") ? `/api/image-proxy?url=${encodeURIComponent(visibleLogo)}` : visibleLogo;
  }, [open, pickMode, visibleLogo]);

  const pickCanvasColor = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((event.clientY - rect.top) * (canvas.height / rect.height));
    const offsetX = Number(canvas.dataset.offsetX || "0");
    const offsetY = Number(canvas.dataset.offsetY || "0");
    const drawWidth = Number(canvas.dataset.drawWidth || canvas.width);
    const drawHeight = Number(canvas.dataset.drawHeight || canvas.height);
    if (x < offsetX || y < offsetY || x > offsetX + drawWidth || y > offsetY + drawHeight) return;
    const [red, green, blue] = context.getImageData(x, y, 1, 1).data;
    setDraftColor(`#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("").toUpperCase()}`);
  };

  const colorMenu = showColorControl && open ? (
    <div ref={menuRef} className="identity-color-menu" style={{ top: menuPosition.top, left: menuPosition.left }}>
      <div><strong>Colors from logo</strong><button type="button" aria-label="Close color selector" onClick={() => setOpen(false)}><X /></button></div>
      <p>{suggestions.length ? "Choose a top image color, enter a custom color, or pick directly from the logo." : "Upload a logo to reveal its top colors."}</p>
      <div className="suggested-swatches">
        {suggestions.map((suggestion, index) => <button type="button" aria-label={`Preview image color ${index + 1}: ${suggestion}`} className={draftColor.toUpperCase() === suggestion ? "active" : ""} key={`${suggestion}-${index}`} style={{ background: suggestion }} onClick={() => setDraftColor(suggestion)}><CheckMark /></button>)}
        {!suggestions.length && ["#117A45", "#E3B940", "#2457A7", "#B42318", "#2457A7"].map((suggestion, index) => <span key={`${suggestion}-${index}`} style={{ background: suggestion }} />)}
      </div>
      <label className="custom-color-row"><span>Custom color</span><span className="custom-color-chip" style={{ background: draftColor }}><Pipette /><input type="color" value={draftColor} onChange={(event) => setDraftColor(event.target.value)} /></span><code>{draftColor.toUpperCase()}</code></label>
      {visibleLogo && <button type="button" className={`logo-picker-toggle ${pickMode ? "active" : ""}`} onClick={() => setPickMode((current) => !current)}><Pipette />Pick from logo</button>}
      {pickMode && visibleLogo && <div className="logo-color-picker"><div><canvas ref={canvasRef} onClick={pickCanvasColor} aria-label="Pick a color from the logo" /><button type="button" className="identity-logo-remove" aria-label={`Remove ${name} logo`} onClick={() => { onChange({ logoUrl: "" }); setSuggestions([]); setFailedLogo(null); setPickMode(false); }}><X /></button></div>{pickerError ? <span>{pickerError}</span> : <small>Click any part of the logo to use that exact color.</small>}</div>}
      <button type="button" className="confirm-color" onClick={() => { onChange({ color: draftColor }); setOpen(false); }}>Use this color</button>
    </div>
  ) : null;

  return (
    <div className={`identity-picker ${compact ? "identity-picker-compact" : ""}`}>
      <input id={inputId} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => upload(event.target.files?.[0])} />
      <Tooltip label={visibleLogo ? `Change ${name} logo` : `Upload ${name} logo`}>
        <label className={`identity-logo-button ${visibleLogo && imagePresentation === "bare" ? "identity-logo-button-bare" : ""}`} htmlFor={inputId} style={compact ? { background: visibleLogo && imagePresentation === "bare" ? "transparent" : visibleLogo ? tintColor(color) : color, borderColor: color, color: readableTextColor(color) } : undefined}>
          {busy ? <LoaderCircle className="spin" /> : visibleLogo ? <img src={visibleLogo} alt="" onError={() => setFailedLogo(visibleLogo)} /> : compact ? <ImagePlus /> : <><ImagePlus /><span><strong>Add {name.toLowerCase()} logo</strong><small>We’ll pull its top three colors</small></span></>}
        </label>
      </Tooltip>
      {compact && showAbbreviation && <span className="identity-name">{abbreviation}</span>}
      {showColorControl && <Tooltip label={`Choose ${name} color`}>
        <button ref={paletteRef} type="button" className="identity-palette-toggle" aria-label={`Choose ${name} color`} onClick={() => setOpen((current) => {
          const next = !current;
          if (next) window.dispatchEvent(new CustomEvent(IDENTITY_COLOR_MENU_EVENT, { detail: { id: menuId } }));
          return next;
        })}><span style={{ background: color }}><Palette /></span></button>
      </Tooltip>}
      {colorMenu && createPortal(colorMenu, document.body)}
    </div>
  );
}

function CheckMark() {
  return <span aria-hidden="true">✓</span>;
}
