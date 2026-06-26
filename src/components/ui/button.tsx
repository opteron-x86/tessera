"use client";

import clsx from "clsx";
import { forwardRef } from "react";

type Variant = "primary" | "accent" | "ghost" | "danger" | "gold";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-surface-2 text-content border border-line-strong hover:bg-surface-3 hover:border-line-strong",
  accent:
    "bg-accent/90 text-content border border-accent-hover/60 hover:bg-accent font-semibold uppercase tracking-wide",
  gold: "bg-gold text-[#0b0d12] border border-transparent hover:brightness-110 font-semibold",
  ghost: "bg-transparent text-content-muted border border-transparent hover:bg-surface-2 hover:text-content",
  danger:
    "bg-transparent text-danger border border-danger/40 hover:bg-danger/10"
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2"
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-fast",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
});
