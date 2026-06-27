"use client";

import clsx from "clsx";
import type { CardInstance, PlayerSlot } from "@/game/types";
import { CardFace } from "./card-face";

const OWNER_COLOR: Record<PlayerSlot, string> = {
  one: "var(--player-one)",
  two: "var(--player-two)"
};

type Orientation = "vertical" | "horizontal";
type Shift = "right" | "left" | "up" | "down";

const SHIFT_SELECTED: Record<Shift, string> = {
  right: "translate-x-4",
  left: "-translate-x-4",
  up: "-translate-y-4",
  down: "translate-y-4"
};

const SHIFT_HOVER: Record<Shift, string> = {
  right: "hover:translate-x-2",
  left: "hover:-translate-x-2",
  up: "hover:-translate-y-2",
  down: "hover:translate-y-2"
};

/** Overlap so up to five cards always fit the board's length on the cross axis. */
function overlap(orientation: Orientation, index: number) {
  if (index === 0) {
    return undefined;
  }
  return orientation === "vertical"
    ? { marginTop: "calc((var(--hand-span) - var(--hcard-h)) / 4 - var(--hcard-h))" }
    : { marginLeft: "calc((var(--hand-span) - var(--hcard-w)) / 4 - var(--hcard-w))" };
}

function CardBack({ owner }: { owner?: PlayerSlot }) {
  return (
    <div
      className="card-face relative aspect-[3/4] w-full overflow-hidden rounded-md border-2"
      style={
        {
          "--card-primary": owner ? OWNER_COLOR[owner] : "#1b2030",
          borderColor: owner ? OWNER_COLOR[owner] : "var(--border-strong)"
        } as React.CSSProperties
      }
    >
      <img src="/cards/card-back.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="card-vignette" aria-hidden />
      <div className="card-frame" aria-hidden />
    </div>
  );
}

export function Hand({
  cards,
  orientation,
  selectedCardId,
  canAct,
  onSelect,
  interactive = true,
  faceDown = false,
  shift = "right",
  owner,
  label
}: {
  cards: CardInstance[];
  orientation: Orientation;
  selectedCardId: string | null;
  canAct: boolean;
  onSelect: (cardId: string | null) => void;
  interactive?: boolean;
  faceDown?: boolean;
  shift?: Shift;
  owner?: PlayerSlot;
  label?: string;
}) {
  const vertical = orientation === "vertical";

  return (
    <div
      role="group"
      aria-label={label}
      className={clsx("flex items-center justify-center", vertical ? "h-full flex-col" : "w-full flex-row")}
      style={
        {
          "--hcard-w": "var(--card-w)",
          "--hcard-h": "calc(var(--card-w) * 4 / 3)"
        } as React.CSSProperties
      }
    >
      {cards.map((card, index) => {
        const selected = interactive && selectedCardId === card.id;

        if (faceDown) {
          return (
            <div
              key={card.id}
              aria-label="Opponent card, face down"
              className="relative"
              style={{ width: "var(--hcard-w)", ...overlap(orientation, index) }}
            >
              <CardBack owner={owner} />
            </div>
          );
        }

        if (!interactive) {
          return (
            <div
              key={card.id}
              className="relative"
              style={{ width: "var(--hcard-w)", ...overlap(orientation, index) }}
            >
              <CardFace card={card.template} variant="hand" owner={owner} className="w-full" />
            </div>
          );
        }

        return (
          <button
            key={card.id}
            disabled={!canAct}
            onClick={() => onSelect(selected ? null : card.id)}
            aria-pressed={selected}
            aria-label={`${card.template.name}${selected ? ", selected" : ""}`}
            className={clsx(
              "relative rounded-md transition-transform duration-base",
              selected ? clsx("z-20", SHIFT_SELECTED[shift]) : "z-0",
              canAct ? clsx("hover:z-30 focus-visible:z-30", SHIFT_HOVER[shift]) : "opacity-80"
            )}
            style={{ width: "var(--hcard-w)", ...overlap(orientation, index) }}
          >
            <CardFace card={card.template} variant="hand" selected={selected} owner={owner} className="w-full" />
          </button>
        );
      })}
    </div>
  );
}
