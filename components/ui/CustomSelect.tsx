"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { EntityLogo, type EntityLogoType } from "./EntityLogo";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  swatch?: string;
  logoUrl?: string;
  monogram?: string;
  entityType?: EntityLogoType;
}

function OptionIdentity({ option }: { option: SelectOption }) {
  if (!option.logoUrl && !option.swatch && !option.monogram) return null;
  return (
    <EntityLogo className="select-option-identity" color={option.swatch ?? "#117A45"} logoUrl={option.logoUrl} monogram={option.monogram || option.label.slice(0, 3).toUpperCase()} entityType={option.entityType} />
  );
}

export function CustomSelect({ value, options, onChange, label, disabled = false, showSelectedDescription = true, triggerLabel, triggerContent }: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  showSelectedDescription?: boolean;
  /** When set, the trigger shows this fixed label instead of the selected
      option — use where the current value is already shown nearby (e.g. the
      team hero) so the control reads "Switch team" rather than repeating it. */
  triggerLabel?: string;
  /** When set, the trigger renders this content (plus a chevron) instead of the
      default identity+label — use to make an existing element (e.g. the team
      name in the hero) the switcher itself. Renders unstyled, no control chrome. */
  triggerContent?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 190, maxHeight: 250, ready: false });
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = options.find((option) => option.value === value) ?? options[0];
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === selected.value));
  const optionId = (index: number) => `${menuId}-option-${index}`;

  const choose = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    trigger.current?.focus();
  };

  const openAt = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
  };

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!root.current?.contains(target) && !menu.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const triggerRect = trigger.current?.getBoundingClientRect();
      const menuElement = menu.current;
      if (!triggerRect || !menuElement) return;
      const gutter = 12;
      const gap = 5;
      const width = Math.min(Math.max(triggerRect.width, 190), window.innerWidth - gutter * 2);
      const left = Math.min(Math.max(gutter, triggerRect.left), Math.max(gutter, window.innerWidth - width - gutter));
      const below = window.innerHeight - triggerRect.bottom - gutter;
      const above = triggerRect.top - gutter;
      const placeBelow = below >= Math.min(menuElement.scrollHeight, 220) || below >= above;
      const maxHeight = Math.max(120, Math.min(320, placeBelow ? below - gap : above - gap));
      const top = placeBelow
        ? triggerRect.bottom + gap
        : Math.max(gutter, triggerRect.top - Math.min(menuElement.scrollHeight, maxHeight) - gap);
      setPosition({ left, top, width, maxHeight, ready: true });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, options.length]);

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const nextIndex = event.key === "ArrowUp"
        ? Math.max(0, selectedIndex - 1)
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? options.length - 1
            : Math.min(options.length - 1, selectedIndex + 1);
      openAt(nextIndex);
    }
  };

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(options.length - 1, current + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(0, current - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className="custom-select" ref={root}>
      <button ref={trigger} type="button" className={`custom-select-trigger${triggerLabel ? " custom-select-trigger-labeled" : ""}${triggerContent ? " custom-select-trigger-content" : ""}`} aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? menuId : undefined} aria-activedescendant={open ? optionId(activeIndex) : undefined} disabled={disabled} onClick={() => open ? setOpen(false) : openAt(selectedIndex)} onKeyDown={onTriggerKeyDown}>
        {triggerContent ? (
          triggerContent
        ) : triggerLabel ? (
          <span><strong>{triggerLabel}</strong></span>
        ) : (
          <>
            <OptionIdentity option={selected} />
            <span><strong>{selected.label}</strong>{showSelectedDescription && selected.description && <small>{selected.description}</small>}</span>
          </>
        )}
        <ChevronDown className={open ? "open" : ""} />
      </button>
      {open && !disabled && typeof document !== "undefined" && createPortal(
        <div ref={menu} id={menuId} className="custom-select-menu" role="listbox" aria-label={label} aria-activedescendant={optionId(activeIndex)} onKeyDown={onMenuKeyDown} style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight, visibility: position.ready ? "visible" : "hidden" }}>
          {options.map((option, index) => (
            <button ref={(node) => { optionRefs.current[index] = node; }} id={optionId(index)} type="button" role="option" aria-selected={option.value === value} data-active={index === activeIndex ? "true" : undefined} key={option.value} onClick={() => choose(option.value)}>
              <OptionIdentity option={option} />
              <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
              {option.value === value && <Check />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
