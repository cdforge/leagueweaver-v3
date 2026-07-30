"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { EntityLogo } from "./EntityLogo";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  swatch?: string;
  logoUrl?: string;
  monogram?: string;
}

function OptionIdentity({ option }: { option: SelectOption }) {
  if (!option.logoUrl && !option.swatch && !option.monogram) return null;
  return (
    <EntityLogo className="select-option-identity" color={option.swatch ?? "#117A45"} logoUrl={option.logoUrl} monogram={option.monogram || option.label.slice(0, 3).toUpperCase()} />
  );
}

export function CustomSelect({ value, options, onChange, label }: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="custom-select" ref={root}>
      <button type="button" className="custom-select-trigger" aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <OptionIdentity option={selected} />
        <span><strong>{selected.label}</strong>{selected.description && <small>{selected.description}</small>}</span>
        <ChevronDown className={open ? "open" : ""} />
      </button>
      {open && (
        <div className="custom-select-menu" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button type="button" role="option" aria-selected={option.value === value} key={option.value} onClick={() => { onChange(option.value); setOpen(false); }}>
              <OptionIdentity option={option} />
              <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
              {option.value === value && <Check />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
