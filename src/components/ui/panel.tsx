import clsx from "clsx";
import { Flourish } from "./flourish";

export function Panel({
  className,
  children,
  flourish = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { flourish?: boolean }) {
  return (
    <div
      className={clsx(
        "relative border border-line bg-surface shadow-e2 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {flourish && <Flourish />}
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  subtitle,
  action
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="plate flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="min-w-0">
        <h2 className="heading font-display text-base font-semibold leading-tight">{title}</h2>
        {subtitle && <p className="truncate text-sm text-content-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({
  className,
  children,
  style
}: {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={style}
      className={clsx(
        "inline-flex items-center gap-1 border border-line-strong px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        className
      )}
    >
      {children}
    </span>
  );
}
