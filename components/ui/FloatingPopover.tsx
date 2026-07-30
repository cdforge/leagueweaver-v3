"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type FloatingPosition = { left: number; top: number; maxHeight: number; ready: boolean };

export function FloatingPopover({
  label,
  trigger,
  children,
  align = "end",
  className = "",
  menuClassName = "",
  closeOnSelect = true,
}: {
  label: string;
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
  menuClassName?: string;
  closeOnSelect?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<FloatingPosition>({ left: 0, top: 0, maxHeight: 320, ready: false });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      const menu = menuRef.current;
      if (!triggerRect || !menu) return;
      const gutter = 12;
      const gap = 6;
      const menuWidth = menu.offsetWidth;
      const menuHeight = menu.scrollHeight;
      const below = window.innerHeight - triggerRect.bottom - gutter;
      const above = triggerRect.top - gutter;
      const placeBelow = below >= Math.min(menuHeight, 240) || below >= above;
      const maxHeight = Math.max(120, Math.min(360, placeBelow ? below - gap : above - gap));
      const desiredLeft = align === "start" ? triggerRect.left : triggerRect.right - menuWidth;
      const left = Math.min(Math.max(gutter, desiredLeft), Math.max(gutter, window.innerWidth - menuWidth - gutter));
      const top = placeBelow
        ? triggerRect.bottom + gap
        : Math.max(gutter, triggerRect.top - Math.min(menuHeight, maxHeight) - gap);
      setPosition({ left, top, maxHeight, ready: true });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [align, open]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <span className={`floating-popover ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        className="floating-popover-trigger"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        title={label}
        onClick={() => setOpen((current) => !current)}
      >
        {trigger}
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          id={id}
          className={`floating-layer-menu ${menuClassName}`.trim()}
          role="menu"
          style={{ left: position.left, top: position.top, maxHeight: position.maxHeight, visibility: position.ready ? "visible" : "hidden" }}
          onClick={(event) => {
            if (closeOnSelect && (event.target as HTMLElement).closest("a, button, [role='menuitem']")) setOpen(false);
          }}
        >
          {children}
        </div>,
        document.body,
      )}
    </span>
  );
}
