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

function describe(event: MatchEvent): string {
  switch (event.type) {
    case "CARD_PLACED":
      return `${who(event.player)} placed a card on tile ${event.position + 1}.`;
    case "CARDS_CAPTURED": {
      const count = event.positions.length;
      const tag = event.reason === "normal" ? "" : ` (${CAPTURE_LABEL[event.reason]})`;
      return `${who(event.player)} captured ${count} card${count > 1 ? "s" : ""}${tag}.`;
    }
    case "MATCH_FINISHED":
      return event.winner === "draw" ? "Match drawn." : `${who(event.winner)} won the match.`;
    case "MATCH_CONCEDED":
      return `${who(event.player)} conceded.`;
  }
}

export function MatchLog({ game }: { game: GameState }) {
  if (game.events.length === 0) {
    return <p className="text-sm text-content-faint">No moves yet.</p>;
  }
  return (
    <ol aria-live="polite" className="scroll-thin flex max-h-64 flex-col gap-1.5 overflow-y-auto">
      {game.events
        .slice(-12)
        .reverse()
        .map((event, index) => (
          <li
            key={`${event.type}-${event.moveNumber}-${index}`}
            className="rounded-sm border border-line bg-surface-2 px-2.5 py-1.5 text-sm text-content-muted"
          >
            {describe(event)}
          </li>
        ))}
    </ol>
  );
}
