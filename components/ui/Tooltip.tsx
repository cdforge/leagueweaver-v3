"use client";

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, ready: false, below: false });
  const anchor = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const anchorRect = anchor.current?.getBoundingClientRect();
      const bubbleRect = bubble.current?.getBoundingClientRect();
      if (!anchorRect || !bubbleRect) return;
      const gutter = 8;
      const below = anchorRect.top < bubbleRect.height + 16;
      const left = Math.min(Math.max(gutter + bubbleRect.width / 2, anchorRect.left + anchorRect.width / 2), window.innerWidth - gutter - bubbleRect.width / 2);
      const top = below ? anchorRect.bottom + 8 : anchorRect.top - bubbleRect.height - 8;
      setPosition({ left, top, ready: true, below });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  return (
    <span ref={anchor} className="tooltip-wrap" aria-describedby={open ? id : undefined} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      {children}
      {open && typeof document !== "undefined" && createPortal(
        <span ref={bubble} id={id} className={`tooltip-bubble tooltip-bubble-portal ${position.below ? "below" : ""}`} role="tooltip" style={{ left: position.left, top: position.top, visibility: position.ready ? "visible" : "hidden" }}>{label}</span>,
        document.body,
      )}
    </span>
  );
}
