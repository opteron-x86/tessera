"use client";

import clsx from "clsx";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { CardFace } from "@/components/game/card-face";
import { Button } from "@/components/ui/button";
import { rarityColor } from "@/lib/client/cards";
import type { OpenedCard } from "@/lib/client/store";

const REVEAL_STAGGER_MS = 480;

export function PackReveal({ cards, onClose }: { cards: OpenedCard[]; onClose: () => void }) {
  const [revealed, setRevealed] = useState(0);
  const done = revealed >= cards.length;

  useEffect(() => {
    setRevealed(0);
    const timers = cards.map((_, index) =>
      window.setTimeout(() => setRevealed((current) => Math.max(current, index + 1)), index * REVEAL_STAGGER_MS + 250)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [cards]);

  const skip = () => setRevealed(cards.length);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pack contents"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/85 p-6 backdrop-blur-sm"
      onClick={done ? onClose : skip}
    >
      <p className="heading flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-content-muted">
        <Sparkles size={14} className="text-gold" /> Your pull
      </p>

      <div className="flex max-w-4xl flex-wrap items-center justify-center gap-3 sm:gap-4">
        {cards.map((card, index) => (
          <RevealCard key={`${card.template.id}-${index}`} card={card} shown={index < revealed} />
        ))}
      </div>

      <p className="h-5 text-sm text-content-faint">
        {done ? "Tap anywhere to close" : "Tap to reveal all"}
      </p>

      <Button
        variant="accent"
        onClick={(event) => {
          event.stopPropagation();
          if (done) onClose();
          else skip();
        }}
      >
        {done ? "Continue" : "Reveal all"}
      </Button>
    </div>
  );
}

function RevealCard({ card, shown }: { card: OpenedCard; shown: boolean }) {
  const glow = rarityColor(card.template.rarity);
  return (
    <div className="w-[26vw] max-w-[150px] sm:w-32" style={{ perspective: "900px" }}>
      {shown ? (
        <div className="animate-flip relative" style={{ filter: `drop-shadow(0 0 14px ${glow}66)` }}>
          <CardFace card={card.template} variant="reveal" />
          <span
            className={clsx(
              "absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              card.isNew
                ? "border-gold bg-gold text-[#0b0d12]"
                : "border-line-strong bg-surface text-content-muted"
            )}
          >
            {card.isNew ? "New" : `Owned ${card.ownedBefore}`}
          </span>
        </div>
      ) : (
        <div
          className="card-face relative grid aspect-[3/4] place-items-center rounded-md border-2 border-line-strong"
          style={{ "--card-primary": "#1b2030" } as React.CSSProperties}
        >
          <div className="card-vignette" aria-hidden />
          <img src="/tessera-mark.svg" alt="" className="h-2/5 w-2/5 opacity-30" />
        </div>
      )}
    </div>
  );
}
