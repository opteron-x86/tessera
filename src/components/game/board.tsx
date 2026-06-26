"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BoardCell, CaptureReason, GameState, MatchEvent } from "@/game/types";
import { effectiveSidesForCell, emptyPositions } from "@/game/engine";
import { CardFace } from "./card-face";

const NORMAL_FLIP_DELAY_MS = 90;
const SPECIAL_FLIP_DELAY_MS = 620;
const COMBO_TEXT_DELAY_MS = 980;
const COMBO_FLIP_DELAY_MS = 1360;
const CAPTURE_FLIP_MS = 520;
const RULE_BURST_MS = 760;
const ANIMATION_SETTLE_PADDING_MS = 140;

type CaptureAnimation = {
  position: number;
  reason: CaptureReason;
  delayMs: number;
};

type BoardAnimation = {
  key: string;
  placedPosition: number | null;
  specialLabel: string | null;
  hasCombo: boolean;
  captures: CaptureAnimation[];
};

function ownerRing(owner: BoardCell["owner"]) {
  return owner === "one" ? "var(--player-one)" : "var(--player-two)";
}

function captureDelay(reason: CaptureReason) {
  if (reason === "combo") {
    return COMBO_FLIP_DELAY_MS;
  }

  if (reason === "same" || reason === "plus") {
    return SPECIAL_FLIP_DELAY_MS;
  }

  return NORMAL_FLIP_DELAY_MS;
}

export function lastMoveAnimationSettleMs(game: GameState) {
  const captureEvents = game.events.filter(
    (event): event is Extract<MatchEvent, { type: "CARDS_CAPTURED" }> =>
      event.moveNumber === game.moveNumber && event.type === "CARDS_CAPTURED"
  );

  if (captureEvents.length === 0) {
    return 0;
  }

  const captureEndMs = Math.max(
    ...captureEvents.map((event) => captureDelay(event.reason) + CAPTURE_FLIP_MS)
  );
  const specialTextEndMs = captureEvents.some(
    (event) => event.reason === "same" || event.reason === "plus"
  )
    ? RULE_BURST_MS
    : 0;
  const comboTextEndMs = captureEvents.some((event) => event.reason === "combo")
    ? COMBO_TEXT_DELAY_MS + RULE_BURST_MS
    : 0;

  return Math.max(captureEndMs, specialTextEndMs, comboTextEndMs) + ANIMATION_SETTLE_PADDING_MS;
}

function latestMoveAnimation(game: GameState): BoardAnimation | null {
  if (game.moveNumber === 0) {
    return null;
  }

  const moveEvents = game.events.filter((event) => event.moveNumber === game.moveNumber);
  const placed = moveEvents.find(
    (event): event is Extract<MatchEvent, { type: "CARD_PLACED" }> =>
      event.type === "CARD_PLACED"
  );
  const captureEvents = moveEvents.filter(
    (event): event is Extract<MatchEvent, { type: "CARDS_CAPTURED" }> =>
      event.type === "CARDS_CAPTURED"
  );

  if (!placed && captureEvents.length === 0) {
    return null;
  }

  const specialLabels = [
    ...new Set(
      captureEvents
        .filter((event) => event.reason === "same" || event.reason === "plus")
        .map((event) => event.reason.toUpperCase())
    )
  ];
  const captures = captureEvents.flatMap((event) =>
    event.positions.map((position) => ({
      position,
      reason: event.reason,
      delayMs: captureDelay(event.reason)
    }))
  );

  return {
    key: [
      game.id,
      game.moveNumber,
      placed?.position ?? "none",
      captureEvents.map((event) => `${event.reason}:${event.positions.join(".")}`).join("|")
    ].join(":"),
    placedPosition: placed?.position ?? null,
    specialLabel: specialLabels.length > 0 ? specialLabels.join(" + ") : null,
    hasCombo: captureEvents.some((event) => event.reason === "combo"),
    captures
  };
}

function BoardCard({
  cell,
  game,
  board,
  effect
}: {
  cell: BoardCell;
  game: GameState;
  board: Array<BoardCell | null>;
  effect?: "place" | "capture";
}) {
  const effectiveSides = effectiveSidesForCell(cell, game.rules, board);
  return (
    <div
      className={clsx(
        "card-board-shell absolute inset-1 overflow-hidden rounded-md",
        effect === "place" && "animate-card-place",
        effect === "capture" && "animate-card-capture"
      )}
      style={{ boxShadow: `0 0 16px ${ownerRing(cell.owner)}66` }}
    >
      <CardFace
        card={cell.card.template}
        variant="board"
        owner={cell.owner}
        sidesOverride={effectiveSides}
      />
    </div>
  );
}

export function GameBoard({
  game,
  selectedCardId,
  canAct,
  onCellClick
}: {
  game: GameState;
  selectedCardId: string | null;
  canAct: boolean;
  onCellClick: (position: number) => void;
}) {
  const animation = useMemo(
    () => latestMoveAnimation(game),
    [game]
  );
  const [displayBoard, setDisplayBoard] = useState(game.board);
  const [flippingPositions, setFlippingPositions] = useState<Record<number, string>>({});
  const lastAnimationKey = useRef<string | null>(null);
  const legal = new Set(emptyPositions(game));
  const placing = canAct && Boolean(selectedCardId);

  useEffect(() => {
    if (!animation || animation.key === lastAnimationKey.current) {
      setDisplayBoard(game.board);
      return;
    }

    lastAnimationKey.current = animation.key;
    const timers: number[] = [];
    const capturedPositions = new Set(animation.captures.map((capture) => capture.position));

    setFlippingPositions({});
    setDisplayBoard((previous) =>
      game.board.map((cell, index) =>
        capturedPositions.has(index) ? (previous[index] ?? cell) : cell
      )
    );

    for (const capture of animation.captures) {
      timers.push(
        window.setTimeout(() => {
          setDisplayBoard((current) =>
            current.map((cell, index) => (index === capture.position ? game.board[index] : cell))
          );
          setFlippingPositions((current) => ({
            ...current,
            [capture.position]: animation.key
          }));

          timers.push(
            window.setTimeout(() => {
              setFlippingPositions((current) => {
                const next = { ...current };
                delete next[capture.position];
                return next;
              });
            }, CAPTURE_FLIP_MS)
          );
        }, capture.delayMs)
      );
    }

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [animation, game.board]);

  return (
    <div className="relative">
      <div
        role="grid"
        aria-label="Tessera board"
        className="board-stage grid w-max grid-cols-3 gap-2 rounded-lg border border-line bg-bg p-2 shadow-e2"
      >
        {displayBoard.map((cell, index) => {
          const isLegalTarget = placing && legal.has(index);
          const flipKey = flippingPositions[index];
          const effect =
            flipKey !== undefined
              ? "capture"
              : animation?.placedPosition === index
                ? "place"
                : undefined;

          return (
            <button
              key={index}
              role="gridcell"
              disabled={!isLegalTarget}
              onClick={() => onCellClick(index)}
              style={{ width: "var(--card-w)" }}
              aria-label={
                game.board[index]
                  ? `Tile ${index + 1}, held by ${
                      game.board[index]?.owner === "one" ? "you" : "opponent"
                    }`
                  : `Tile ${index + 1}, empty`
              }
              className={clsx(
                "relative aspect-[3/4] rounded-md border bg-surface/40 transition-colors duration-fast",
                !cell &&
                  "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_70%)]",
                isLegalTarget
                  ? "tile-legal border-accent/50 cursor-pointer hover:bg-accent/10"
                  : "border-line"
              )}
            >
              {cell && (
                <BoardCard
                  key={`${index}-${cell.owner}-${flipKey ?? "steady"}`}
                  cell={cell}
                  game={game}
                  board={displayBoard}
                  effect={effect}
                />
              )}
            </button>
          );
        })}
      </div>
      {animation?.specialLabel && (
        <RuleBurst key={`${animation.key}-special`} label={animation.specialLabel} />
      )}
      {animation?.hasCombo && (
        <RuleBurst
          key={`${animation.key}-combo`}
          label="COMBO"
          tone="combo"
          delayMs={COMBO_TEXT_DELAY_MS}
        />
      )}
    </div>
  );
}

function RuleBurst({
  label,
  tone = "special",
  delayMs = 0
}: {
  label: string;
  tone?: "special" | "combo";
  delayMs?: number;
}) {
  return (
    <div
      className={clsx("rule-burst", tone === "combo" && "rule-burst-combo")}
      style={{ "--rule-delay": `${delayMs}ms` } as React.CSSProperties}
      aria-hidden
    >
      <span>{label}</span>
    </div>
  );
}
