import clsx from "clsx";
import { forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={clsx(
          "h-11 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-content",
          "placeholder:text-content-faint focus-visible:border-accent",
          className
        )}
        {...props}
      />
    );
  }
);
