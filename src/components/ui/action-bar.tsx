import clsx from "clsx";

export type Action = {
  keys: string[];
  label: string;
  onClick?: () => void;
};

/** Footer strip of key-hint actions, like the Skyrim inventory action bar. */
export function ActionBar({ actions, className }: { actions: Action[]; className?: string }) {
  return (
    <div className={clsx("flex flex-wrap items-center gap-x-5 gap-y-2", className)}>
      {actions.map((action) => {
        const Wrapper = action.onClick ? "button" : "div";
        return (
          <Wrapper
            key={action.label}
            onClick={action.onClick}
            className={clsx(
              "flex items-center gap-1.5 text-sm text-content-muted",
              action.onClick && "transition-colors hover:text-content"
            )}
          >
            <span className="flex gap-1">
              {action.keys.map((key) => (
                <kbd key={key} className="keycap">
                  {key}
                </kbd>
              ))}
            </span>
            <span className="heading text-xs">{action.label}</span>
          </Wrapper>
        );
      })}
    </div>
  );
}
