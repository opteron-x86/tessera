"use client";

import { DoorOpen, RefreshCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameState, PlayerSlot } from "@/game/types";

export function OutcomeOverlay({
  game,
  youSlot = "one",
  onPlayAgain,
  onReturnToLobby,
  reward
}: {
  game: GameState;
  youSlot?: PlayerSlot;
  onPlayAgain?: () => void;
  onReturnToLobby: () => void;
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
        <div className="flex flex-col gap-2 sm:flex-row">
          {onPlayAgain && (
            <Button variant="accent" size="lg" onClick={onPlayAgain}>
              <RefreshCcw size={17} /> Play again
            </Button>
          )}
          <Button variant="primary" size="lg" onClick={onReturnToLobby}>
            <DoorOpen size={17} /> Return to lobby
          </Button>
        </div>
      </div>
    </div>
  );
}
