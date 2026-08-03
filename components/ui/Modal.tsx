"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// A single source of truth for modal layering so nested overlays (a discard
// confirm on top of the score sheet) only respond to Escape/Tab when they are
// the topmost surface. Populated in mount order; the last entry is the top.
const modalStack: string[] = [];

// Reference-counted scroll lock. Per-instance save/restore of body.overflow
// breaks when two modals unmount in the same React batch (the inner cleanup
// runs first and restores "hidden", leaving the page locked). Counting instead
// means only the first modal saves the original overflow and only the last one
// unmounting restores it — order-independent.
let scrollLockCount = 0;
let savedBodyOverflow = "";
function lockScroll() {
  if (scrollLockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLockCount += 1;
}
function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) document.body.style.overflow = savedBodyOverflow;
}

/**
 * The one modal shell every dialog in the app renders through. It owns the
 * behaviour that used to be copy-pasted per modal — a portal to <body>, a focus
 * trap, scroll lock, focus restore, Escape, and backdrop-dismiss — so each modal
 * only supplies its own content and panel class. Consumers keep their existing
 * panel classes (`import-modal`, `season-save-conflict`, …) for visuals; this
 * component just guarantees the interaction contract is identical everywhere.
 */
export function Modal({
  onClose,
  children,
  className = "",
  backdropClassName = "",
  role = "dialog",
  labelledBy,
  describedBy,
  label,
  busy,
  closeOnBackdrop = true,
  closeOnEscape = true,
  initialFocusRef,
  dialogRef: externalDialogRef,
}: {
  onClose: () => void;
  children: React.ReactNode;
  /** Panel class (e.g. "import-modal"). Applied to the dialog <section>. */
  className?: string;
  /** Extra class on the backdrop, for per-modal z-index or tint overrides. */
  backdropClassName?: string;
  role?: "dialog" | "alertdialog";
  labelledBy?: string;
  describedBy?: string;
  /** aria-label fallback when there is no visible title to point at. */
  label?: string;
  busy?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  /** Where to send focus on open. Defaults to the first focusable element. */
  initialFocusRef?: { readonly current: HTMLElement | null };
  dialogRef?: React.RefObject<HTMLElement | null>;
}) {
  const internalRef = useRef<HTMLElement>(null);
  const dialogRef = externalDialogRef ?? internalRef;
  const id = useId();
  // Keep the latest close handler without re-registering listeners on every
  // render, so a modal whose onClose closes over changing state stays correct.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    modalStack.push(id);
    const isTop = () => modalStack[modalStack.length - 1] === id;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    lockScroll();

    const focusable = () => {
      const dialog = dialogRef.current;
      if (!dialog) return [] as HTMLElement[];
      return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    };

    const handleKey = (event: KeyboardEvent) => {
      if (!isTop()) return;
      if (event.key === "Escape" && closeOnEscape) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", handleKey);

    // Defer initial focus a tick so children (and any autoFocus target) exist.
    const focusTimer = window.setTimeout(() => {
      const target = initialFocusRef?.current ?? focusable()[0] ?? dialogRef.current;
      target?.focus();
    }, 0);

    return () => {
      window.removeEventListener("keydown", handleKey);
      window.clearTimeout(focusTimer);
      unlockScroll();
      const index = modalStack.lastIndexOf(id);
      if (index !== -1) modalStack.splice(index, 1);
      if (previouslyFocused && document.body.contains(previouslyFocused)) previouslyFocused.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`modal-backdrop ${backdropClassName}`.trim()}
      role="presentation"
      onMouseDown={(event) => { if (closeOnBackdrop && event.target === event.currentTarget) onClose(); }}
    >
      <section
        ref={dialogRef as React.RefObject<HTMLElement>}
        className={className}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-label={labelledBy ? undefined : label}
        aria-busy={busy}
        tabIndex={-1}
      >
        {children}
      </section>
    </div>,
    document.body,
  );
}

export interface ConfirmAction {
  label: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Send initial focus here on open — mark the *safe* choice on risky prompts. */
  autoFocus?: boolean;
}

/**
 * The shared shell for guard/confirm dialogs (leave-builder, discard edits,
 * save reminders). Renders the `.season-save-conflict` header/body/footer that
 * these prompts already used, on top of {@link Modal}, so every one of them gets
 * the full focus/scroll/escape contract for free — plus a `danger` tone and
 * explicit safe-default focus that the hand-rolled versions lacked.
 */
export function ConfirmDialog({
  title,
  kicker,
  icon,
  tone = "default",
  mark,
  markClassName = "",
  children,
  actions,
  onClose,
  closeLabel = "Close",
  labelId: providedLabelId,
  descriptionId,
  role = "dialog",
  backdropClassName = "",
  busy,
}: {
  title: React.ReactNode;
  kicker?: React.ReactNode;
  /** Icon inside the header mark. Ignored when `mark` is supplied. */
  icon?: React.ReactNode;
  tone?: "default" | "danger" | "gold";
  /** Full custom mark contents (e.g. a provider logo) replacing the icon. */
  mark?: React.ReactNode;
  markClassName?: string;
  children?: React.ReactNode;
  actions: ConfirmAction[];
  onClose: () => void;
  closeLabel?: string;
  labelId?: string;
  descriptionId?: string;
  role?: "dialog" | "alertdialog";
  backdropClassName?: string;
  busy?: boolean;
}) {
  const generatedId = useId();
  const labelId = providedLabelId ?? `${generatedId}-title`;
  const focusRef = useRef<HTMLButtonElement>(null);
  const hasAutoFocus = actions.some((action) => action.autoFocus);

  return (
    <Modal
      onClose={onClose}
      className={`season-save-conflict tone-${tone}`}
      backdropClassName={`season-save-conflict-backdrop ${backdropClassName}`.trim()}
      role={role}
      labelledBy={labelId}
      describedBy={descriptionId}
      busy={busy}
      initialFocusRef={hasAutoFocus ? focusRef : undefined}
    >
      <header>
        <span className={`season-save-conflict-mark ${markClassName}`.trim()}>{mark ?? icon}</span>
        <span>{kicker && <small>{kicker}</small>}<h2 id={labelId}>{title}</h2></span>
        <button type="button" aria-label={closeLabel} disabled={busy} onClick={onClose}><X /></button>
      </header>
      {children && <div>{children}</div>}
      <footer>
        {actions.map((action, index) => (
          <button
            key={index}
            ref={action.autoFocus ? focusRef : undefined}
            type="button"
            className={action.variant === "primary" ? "button-primary" : action.variant === "danger" ? "button-danger" : "button-secondary"}
            disabled={action.disabled || busy}
            onClick={action.onClick}
          >
            {action.icon}{action.label}
          </button>
        ))}
      </footer>
    </Modal>
  );
}
