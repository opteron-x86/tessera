"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { useEffect } from "react";
import { Flourish } from "./flourish";

/**
 * Responsive modal: a bottom sheet on mobile, a centered dialog on desktop.
 */
export function Overlay({
  open,
  onClose,
  title,
  children,
  className
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
      />
      <div
        className={clsx(
          "animate-rise relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden border border-line-strong bg-surface shadow-e3 backdrop-blur-sm",
          "sm:m-4 sm:max-w-lg",
          className
        )}
      >
        <Flourish />
        {title && (
          <div className="plate flex items-center justify-between px-4 py-3">
            <h2 className="heading font-display text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 text-content-muted hover:bg-surface-2 hover:text-content"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="scroll-thin overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
