import clsx from "clsx";
import type { GameState, PlayerSlot } from "@/game/types";

function Side({
  label,
  score,
  color,
  active,
  turnText,
  align
}: {
  label: string;
  score: number;
  color: string;
  active: boolean;
  turnText: string;
  align: "left" | "right";
}) {
  return (
    <div className={clsx("flex min-w-0 items-center gap-2", align === "right" && "flex-row-reverse")}>
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg font-bold tabular-nums text-[#0b0d12]"
        style={{ background: color }}
      >
        {score}
      </span>
      <div className={clsx("min-w-0 leading-tight", align === "right" && "text-right")}>
        <p className="truncate text-sm font-semibold">{label}</p>
        <p
          className={clsx(
            "text-xs transition-opacity",
            active ? "text-content-muted opacity-100" : "opacity-0"
          )}
        >
          {turnText}
        </p>
      </div>
    </div>
  );
}

export function ScoreBar({
  game,
  youSlot = "one"
}: {
  game: GameState;
  youSlot?: PlayerSlot;
}) {
  const oppSlot: PlayerSlot = youSlot === "one" ? "two" : "one";
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-2.5 shadow-e1">
      <Side
        label="You"
        score={game.scores[youSlot]}
        color="var(--player-one)"
        active={game.phase === "active" && game.currentPlayer === youSlot}
        turnText="your turn"
        align="left"
      />
      <span className="font-display text-xs font-semibold uppercase tracking-widest text-content-faint">
        vs
      </span>
      <Side
        label="Opponent"
        score={game.scores[oppSlot]}
        color="var(--player-two)"
        active={game.phase === "active" && game.currentPlayer === oppSlot}
        turnText="their turn"
        align="right"
      />
    </div>
  );
}
