import clsx from "clsx";
import type { CaptureReason, GameState, MatchEvent, PlayerSlot } from "@/game/types";

const CAPTURE_LABEL: Record<CaptureReason, string> = {
  normal: "",
  same: "Same",
  plus: "Plus",
  combo: "Combo"
};

function who(player: PlayerSlot) {
  return player === "one" ? "You" : "Opponent";
}

function cardNameById(game: GameState, cardId: string) {
  for (const cell of game.board) {
    if (cell?.card.id === cardId) {
      return cell.card.template.name;
    }
  }

  for (const card of [...game.hands.one, ...game.hands.two]) {
    if (card.id === cardId) {
      return card.template.name;
    }
  }

  return null;
}

function capturedCardLabel(game: GameState, position: number) {
  return game.board[position]?.card.template.name ?? `a card on tile ${position + 1}`;
}

function formatList(items: string[]) {
  if (items.length <= 1) {
    return items[0] ?? "a card";
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function describeMatchEvent(game: GameState, event: MatchEvent): string {
  switch (event.type) {
    case "CARD_PLACED": {
      const cardName = cardNameById(game, event.cardId) ?? "a card";
      return `${who(event.player)} placed ${cardName} on tile ${event.position + 1}.`;
    }
    case "RULE_TRIGGERED": {
      const rule = event.rule === "decimation" ? "Decimation" : "Legion";
      const effect = event.rule === "decimation" ? "weakened" : "empowered";
      return `${rule} ${effect} ${event.affinity} cards.`;
    }
    case "CARDS_CAPTURED": {
      const tag = event.reason === "normal" ? "" : ` (${CAPTURE_LABEL[event.reason]})`;
      const cards = formatList(event.positions.map((position) => capturedCardLabel(game, position)));
      return `${who(event.player)} captured ${cards}${tag}.`;
    }
    case "MATCH_FINISHED":
      return event.winner === "draw" ? "Match drawn." : `${who(event.winner)} won the match.`;
    case "MATCH_CONCEDED":
      return `${who(event.player)} conceded.`;
  }
}

export function MatchLog({ game, className }: { game: GameState; className?: string }) {
  if (game.events.length === 0) {
    return <p className={clsx("text-sm text-content-faint", className)}>No moves yet.</p>;
  }
  return (
    <ol
      aria-live="polite"
      className={clsx("scroll-thin flex min-h-0 flex-col gap-1.5 overflow-y-auto pr-1", className)}
    >
      {game.events
        .slice()
        .reverse()
        .map((event, index) => (
          <li
            key={`${event.type}-${event.moveNumber}-${index}`}
            className="rounded-sm border border-line bg-surface-2 px-2.5 py-1.5 text-sm text-content-muted"
          >
            {describeMatchEvent(game, event)}
          </li>
        ))}
    </ol>
  );
}
