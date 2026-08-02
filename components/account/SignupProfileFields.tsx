"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Sparkles, Trash2 } from "lucide-react";
import { analyzeIdentityImage } from "@/lib/imageColors";
import { loadSetup } from "@/lib/storage";

export type SignupProfile = { leagueName: string; avatarUrl: string | null; busy: boolean };

export function SignupProfileFields({ onChange }: { onChange: (profile: SignupProfile) => void }) {
  const [leagueName, setLeagueName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leagueLogo] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return loadSetup()?.logoUrl ?? null;
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onChange({ leagueName, avatarUrl, busy });
  }, [leagueName, avatarUrl, busy, onChange]);

  const pickAvatar = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      setError("Choose a PNG, JPG, or WebP image under 8 MB.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const analyzed = await analyzeIdentityImage(file);
      setAvatarUrl(analyzed.logoUrl);
    } catch {
      setError("That image could not be read. Try a different one.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="signup-avatar">
        <span className={`signup-avatar-preview${avatarUrl ? " has-image" : ""}`} aria-hidden="true">{avatarUrl ? <img src={avatarUrl} alt="" /> : <ImagePlus />}</span>
        <div className="signup-avatar-actions">
          <span className="signup-avatar-label">Profile image <em>Optional</em></span>
          <div className="signup-avatar-buttons">
            <button type="button" className="button-secondary" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? <LoaderCircle className="spin" /> : <ImagePlus />}{avatarUrl ? "Change" : "Upload"}</button>
            {leagueLogo && avatarUrl !== leagueLogo && <button type="button" className="signup-avatar-suggest" disabled={busy} onClick={() => { setAvatarUrl(leagueLogo); setError(null); }}><Sparkles />Use your league logo</button>}
            {avatarUrl && <button type="button" className="signup-avatar-remove" aria-label="Remove profile image" onClick={() => setAvatarUrl(null)}><Trash2 /></button>}
          </div>
          {error && <small className="signup-avatar-error" role="alert">{error}</small>}
        </div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => { void pickAvatar(event.target.files?.[0]); event.target.value = ""; }} />
      </div>
      <label><span>League name</span><input type="text" autoComplete="organization" required value={leagueName} onChange={(event) => setLeagueName(event.target.value)} /><small className="field-hint">Shown on your account — usually your league&rsquo;s name.</small></label>
    </>
  );
}
