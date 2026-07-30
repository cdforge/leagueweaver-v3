"use client";

import { useId, useState } from "react";
import { ImagePlus, LoaderCircle, Palette, X } from "lucide-react";
import { analyzeIdentityImage } from "@/lib/imageColors";
import { readableTextColor, tintColor } from "@/lib/colorContrast";
import { Tooltip } from "./Tooltip";

export function IdentityColorPicker({
  name,
  abbreviation,
  color,
  logoUrl,
  onChange,
  compact = false,
}: {
  name: string;
  abbreviation: string;
  color: string;
  logoUrl?: string;
  onChange: (next: { color?: string; logoUrl?: string }) => void;
  compact?: boolean;
}) {
  const inputId = useId();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const visibleLogo = logoUrl && failedLogo !== logoUrl ? logoUrl : undefined;
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const analyzed = await analyzeIdentityImage(file);
      setSuggestions(analyzed.colors);
      onChange({ logoUrl: analyzed.logoUrl, color: analyzed.colors[0] });
      setOpen(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`identity-picker ${compact ? "identity-picker-compact" : ""}`}>
      <input id={inputId} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => upload(event.target.files?.[0])} />
      <Tooltip label={visibleLogo ? `Change ${name} logo` : `Upload ${name} logo`}>
        <label className="identity-logo-button" htmlFor={inputId} style={compact ? { background: visibleLogo ? tintColor(color) : color, borderColor: color, color: readableTextColor(color) } : undefined}>
          {busy ? <LoaderCircle className="spin" /> : visibleLogo ? <img src={visibleLogo} alt="" onError={() => setFailedLogo(visibleLogo)} /> : compact ? <ImagePlus /> : <><ImagePlus /><span><strong>Add {name.toLowerCase()} logo</strong><small>We’ll pull its top three colors</small></span></>}
        </label>
      </Tooltip>
      {compact && <span className="identity-name">{abbreviation}</span>}
      <Tooltip label={`Choose ${name} color`}>
        <button type="button" className="identity-palette-toggle" aria-label={`Choose ${name} color`} onClick={() => setOpen((current) => !current)}><span style={{ background: color }} /><Palette /></button>
      </Tooltip>
      {open && (
        <div className="identity-color-menu">
          <div><strong>Colors from logo</strong><button type="button" aria-label="Close color selector" onClick={() => setOpen(false)}><X /></button></div>
          <p>{suggestions.length ? "Choose a top image color or set a custom one." : "Upload a logo to reveal its top three colors."}</p>
          <div className="suggested-swatches">
            {suggestions.map((suggestion, index) => <button type="button" aria-label={`Use image color ${index + 1}: ${suggestion}`} className={color.toUpperCase() === suggestion ? "active" : ""} key={`${suggestion}-${index}`} style={{ background: suggestion }} onClick={() => onChange({ color: suggestion })}><CheckMark /></button>)}
            {!suggestions.length && ["#117A45", "#E3B940", "#2457A7"].map((suggestion) => <span key={suggestion} style={{ background: suggestion }} />)}
          </div>
          <label className="custom-color-row"><span>Custom color</span><input type="color" value={color} onChange={(event) => onChange({ color: event.target.value })} /><code>{color.toUpperCase()}</code></label>
          {logoUrl && <button type="button" className="remove-logo" onClick={() => { onChange({ logoUrl: "" }); setSuggestions([]); setFailedLogo(null); }}>Remove logo</button>}
        </div>
      )}
    </div>
  );
}

function CheckMark() {
  return <span aria-hidden="true">✓</span>;
}
