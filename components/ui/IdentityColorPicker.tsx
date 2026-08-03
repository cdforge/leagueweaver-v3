"use client";

import { type MouseEvent, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, ImagePlus, LoaderCircle, Palette, Pipette, Trash2, X } from "lucide-react";
import { analyzeIdentityImage } from "@/lib/imageColors";
import { readableTextColor, tintColor } from "@/lib/colorContrast";
import { ColorField } from "./ColorField";
import { Tooltip } from "./Tooltip";

const EMPTY_COLOR_SUGGESTIONS: string[] = [];
// Shown when a team has no logo to pull colors from (e.g. every CSV/paste import). Six
// distinct hues — the old fallback repeated the same blue twice and wasted a slot.
const DEFAULT_COLOR_CHOICES = ["#117A45", "#E3B940", "#2457A7", "#B42318", "#6D28D9", "#0369A1"];
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
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; placement: "below" | "above"; arrowLeft: number }>({ top: 0, left: 0, placement: "below", arrowLeft: 24 });
  const [pickMode, setPickMode] = useState(false);
  const [pickerError, setPickerError] = useState("");
  const logoImageRef = useRef<HTMLImageElement | null>(null);
  const [loadedLogo, setLoadedLogo] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState<string | null>(null);
  const paletteRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visibleLogo = logoUrl && failedLogo !== logoUrl ? logoUrl : undefined;
  const logoLoading = Boolean(visibleLogo && loadingLogo === visibleLogo && loadedLogo !== visibleLogo);
  const markLogoLoaded = () => {
    if (!visibleLogo) return;
    setLoadedLogo(visibleLogo);
    setLoadingLogo((current) => current === visibleLogo ? null : current);
  };
  useEffect(() => {
    if (!visibleLogo) {
      setLoadedLogo(null);
      setLoadingLogo(null);
      return;
    }
    const image = logoImageRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      setLoadedLogo(visibleLogo);
      setLoadingLogo(null);
      return;
    }
    setLoadingLogo(visibleLogo);
  }, [visibleLogo]);
  useEffect(() => {
    const handle = window.setTimeout(() => setSuggestions(colorSuggestions), 0);
    return () => window.clearTimeout(handle);
  }, [colorSuggestions]);
  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => setDraftColor(color), 0);
    return () => window.clearTimeout(handle);
  }, [color, open]);
  useEffect(() => {
    const closeOtherMenu = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (detail?.id !== menuId) setOpen(false);
    };
    window.addEventListener(IDENTITY_COLOR_MENU_EVENT, closeOtherMenu);
    return () => window.removeEventListener(IDENTITY_COLOR_MENU_EVENT, closeOtherMenu);
  }, [menuId]);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || menuRef.current?.contains(target) || paletteRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); paletteRef.current?.focus(); }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);
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
      const gap = 9;
      const belowTop = rect.bottom + gap;
      const aboveTop = rect.top - menuHeight - gap;
      const placeBelow = belowTop <= maxTop;
      const top = Math.max(12, Math.min(maxTop, placeBelow ? belowTop : aboveTop));
      const left = Math.max(12, Math.min(maxLeft, rect.left - 4));
      // Point the arrow at the trigger's centre, clamped so it stays on the popover.
      const arrowLeft = Math.max(16, Math.min(menuWidth - 16, rect.left + rect.width / 2 - left));
      setMenuPosition({ top, left, placement: placeBelow ? "below" : "above", arrowLeft });
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
    <div className="identity-color-popover" data-placement={menuPosition.placement} style={{ top: menuPosition.top, left: menuPosition.left }}>
      <span className="identity-color-arrow" style={{ left: menuPosition.arrowLeft }} aria-hidden="true" />
      <div ref={menuRef} className="identity-color-menu" role="group" aria-label={`Choose ${name} color`}>
        <div><strong>{suggestions.length ? "Colors from logo" : "Team color"}</strong><button type="button" aria-label="Close color selector" onClick={() => setOpen(false)}><X /></button></div>
        <p>{suggestions.length ? "Tap a logo color, tweak the hue, or type a hex." : "Tap a swatch, tweak the hue, or type a hex."}</p>
        <div className="suggested-swatches">
          {suggestions.map((suggestion, index) => <button type="button" aria-label={`Preview image color ${index + 1}: ${suggestion}`} className={draftColor.toUpperCase() === suggestion.toUpperCase() ? "active" : ""} key={`${suggestion}-${index}`} style={{ background: suggestion }} onClick={() => setDraftColor(suggestion)}></button>)}
          {!suggestions.length && DEFAULT_COLOR_CHOICES.map((suggestion, index) => <button type="button" aria-label={`Use color ${index + 1}: ${suggestion}`} className={draftColor.toUpperCase() === suggestion.toUpperCase() ? "active" : ""} key={`${suggestion}-${index}`} style={{ background: suggestion }} onClick={() => setDraftColor(suggestion)}></button>)}
        </div>
        {!pickMode && <ColorField value={draftColor} onChange={(hex) => setDraftColor(hex)} />}
        {visibleLogo && <button type="button" className={`logo-picker-toggle ${pickMode ? "active" : ""}`} aria-pressed={pickMode} onClick={() => setPickMode((current) => !current)}><Pipette />Pick color from logo</button>}
        {pickMode && visibleLogo && <div className="logo-color-picker">
          <div className="logo-color-stage"><canvas ref={canvasRef} onClick={pickCanvasColor} aria-label="Pick a color from the logo" /></div>
          {pickerError
            ? <span className="logo-color-error"><AlertCircle />{pickerError}</span>
            : <p className="logo-color-hint"><Pipette />Click anywhere on the logo to sample that exact color.</p>}
          <button type="button" className="logo-remove-btn" aria-label={`Remove ${name} logo`} onClick={() => { onChange({ logoUrl: "" }); setSuggestions([]); setFailedLogo(null); setPickMode(false); }}><Trash2 />Remove logo</button>
        </div>}
        <button type="button" className="confirm-color" onClick={() => { onChange({ color: draftColor }); setOpen(false); }}>Use this color</button>
      </div>
    </div>
  ) : null;

  return (
    <div className={`identity-picker ${compact ? "identity-picker-compact" : ""}`}>
      <input id={inputId} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => upload(event.target.files?.[0])} />
      <Tooltip label={visibleLogo ? `Change ${name} logo` : `Upload ${name} logo`}>
        <label className={`identity-logo-button ${visibleLogo && imagePresentation === "bare" ? "identity-logo-button-bare" : ""} ${logoLoading ? "identity-logo-loading" : ""}`} htmlFor={inputId} style={compact ? { background: visibleLogo && imagePresentation === "bare" ? "transparent" : visibleLogo ? tintColor(color) : color, borderColor: color, color: readableTextColor(color) } : undefined}>
          {busy ? <LoaderCircle className="spin" /> : visibleLogo ? <><img ref={logoImageRef} src={visibleLogo} alt="" onLoad={markLogoLoaded} onError={() => { setFailedLogo(visibleLogo); setLoadedLogo(null); setLoadingLogo(null); }} />{logoLoading && <LoaderCircle className="identity-logo-spinner spin" aria-hidden="true" />}</> : compact ? <ImagePlus /> : <><ImagePlus /><span><strong>Add {name.toLowerCase()} logo</strong><small>We’ll pull its top colors</small></span></>}
        </label>
      </Tooltip>
      {compact && showAbbreviation && <span className="identity-name">{abbreviation}</span>}
      {showColorControl && <Tooltip label={`Choose ${name} color`}>
        <button ref={paletteRef} type="button" className="identity-palette-toggle" aria-label={`Choose ${name} color`} onClick={() => {
          const next = !open;
          // Telling the other pickers to close is a side effect, so it belongs in the event
          // handler — not inside the setOpen updater, which must stay pure. Dispatching there
          // synchronously set state on sibling pickers mid-render (the console warning).
          if (next) window.dispatchEvent(new CustomEvent(IDENTITY_COLOR_MENU_EVENT, { detail: { id: menuId } }));
          setOpen(next);
        }}><span style={{ background: color, color: readableTextColor(color) }}><Palette /></span></button>
      </Tooltip>}
      {colorMenu && createPortal(colorMenu, document.body)}
    </div>
  );
}
