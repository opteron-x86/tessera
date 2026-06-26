"use client";

import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameState, PlayerSlot } from "@/game/types";

export function OutcomeOverlay({
  game,
  youSlot = "one",
  onPlayAgain,
  reward
}: {
  game: GameState;
  youSlot?: PlayerSlot;
  onPlayAgain: () => void;
  reward?: number;
}) {
  if (game.phase !== "complete") {
    return null;
  }

  const won = game.winner === youSlot;
  const draw = game.winner === "draw";
  const title = draw ? "Draw" : won ? "Victory" : "Defeat";
  const tone = draw ? "var(--text-muted)" : won ? "var(--player-one)" : "var(--player-two)";

  return (
    <div className="absolute inset-0 z-30 grid place-items-center rounded-lg bg-black/70 backdrop-blur-sm">
      <div className="animate-pop flex flex-col items-center gap-4 px-6 text-center">
        <Trophy size={40} style={{ color: tone }} />
        <div>
          <h2 className="font-display text-3xl font-bold" style={{ color: tone }}>
            {title}
          </h2>
          <p className="mt-1 text-content-muted">
            Final score {game.scores[youSlot]} – {game.scores[youSlot === "one" ? "two" : "one"]}
          </p>
          {won && reward ? (
            <p className="mt-1 font-semibold text-gold">+{reward} currency</p>
          ) : null}
        </div>
        <Button variant="accent" size="lg" onClick={onPlayAgain}>
          Play again
        </Button>
      </div>
    </div>
  );
}
