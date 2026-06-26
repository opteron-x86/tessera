import clsx from "clsx";

function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={clsx("absolute h-4 w-4 text-line-strong", className)}
    >
      <path
        d="M3 7 L17 21 M17 7 L3 21"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.75"
      />
    </svg>
  );
}

/**
 * Crossed-line corner brackets, the signature flourish of the Skyrim survival menus.
 */
export function Flourish({ className }: { className?: string }) {
  return (
    <div className={clsx("pointer-events-none absolute inset-0", className)}>
      <Mark className="-left-1 -top-1" />
      <Mark className="-right-1 -top-1 -scale-x-100" />
      <Mark className="-bottom-1 -left-1 -scale-y-100" />
      <Mark className="-bottom-1 -right-1 -scale-100" />
    </div>
  );
}
