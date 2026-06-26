"use client";

import clsx from "clsx";
import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { useTessera, type ToastTone } from "@/lib/client/store";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx("animate-pulse rounded-md bg-surface-2", className)} />
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line px-6 py-12 text-center">
      {Icon && <Icon size={32} className="text-content-faint" />}
      <div>
        <p className="font-display text-base font-semibold">{title}</p>
        {description && <p className="mt-1 text-sm text-content-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const TONE_STYLES: Record<ToastTone, { icon: React.ComponentType<{ size?: number }>; cls: string }> = {
  info: { icon: Info, cls: "border-accent/40 text-content" },
  success: { icon: CheckCircle2, cls: "border-positive/50 text-content" },
  danger: { icon: TriangleAlert, cls: "border-danger/50 text-content" }
};

export function ToastViewport() {
  const { toasts, dismissToast } = useTessera();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end">
      {toasts.map((toast) => {
        const { icon: Icon, cls } = TONE_STYLES[toast.tone];
        return (
          <button
            key={toast.id}
            onClick={() => dismissToast(toast.id)}
            className={clsx(
              "animate-rise pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-md border bg-surface-2 px-3.5 py-2.5 text-left text-sm shadow-e3",
              cls
            )}
          >
            <Icon size={16} />
            <span className="flex-1">{toast.message}</span>
          </button>
        );
      })}
    </div>
  );
}
