"use client";

import { useEffect, useId, useRef } from "react";

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

/** Open dialogs, innermost last. Escape closes only the innermost one. */
const openDialogs: object[] = [];

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** The dialog's accessible name, shown as its heading unless hideTitle is set */
  title: string;
  hideTitle?: boolean;
  /** "alertdialog" for confirmations that need an answer */
  role?: "dialog" | "alertdialog";
  /** Classes for the panel, e.g. its max width */
  className?: string;
  children: React.ReactNode;
}

/**
 * A modal dialog. Escape or a click outside closes it (only the innermost one
 * when dialogs are stacked, e.g. a confirmation over a details view). Focus
 * moves into the dialog when it opens and returns to where it was when it closes.
 */
export function Dialog({
  open,
  onClose,
  title,
  hideTitle = false,
  role = "dialog",
  className = "max-w-md",
  children,
}: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Read the latest onClose without re-running the focus effect on every render
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const self = {};
    openDialogs.push(self);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && openDialogs.at(-1) === self) onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      openDialogs.splice(openDialogs.indexOf(self), 1);
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={`relative w-full overflow-hidden rounded-2xl bg-white shadow-2xl outline-none ${className}`}
      >
        <h2
          id={titleId}
          className={hideTitle ? "sr-only" : "px-6 pt-6 text-lg font-bold text-slate-900"}
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
