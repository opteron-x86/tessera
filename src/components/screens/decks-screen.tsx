"use client";

import clsx from "clsx";
import { Plus, Save } from "lucide-react";
import { CardFace } from "@/components/game/card-face";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useTessera } from "@/lib/client/store";

export function DecksScreen() {
  const { ownedCards, selectedDeckCards, toggleDeckCard, saveCurrentDeck } = useTessera();
  const slots = Array.from({ length: 5 }, (_, index) => selectedDeckCards[index]);
  const valid = selectedDeckCards.length === 5;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="heading font-display text-2xl font-bold">Deck Builder</h1>
        <Button variant="accent" disabled={!valid} onClick={saveCurrentDeck}>
          <Save size={16} /> Save deck
        </Button>
      </div>

      <Panel>
        <PanelHeader
          title="Active deck"
          subtitle={valid ? "Ready to duel" : `Select ${5 - selectedDeckCards.length} more card${5 - selectedDeckCards.length === 1 ? "" : "s"}`}
        />
        <div className="grid grid-cols-5 gap-2 p-4 sm:gap-3">
          {slots.map((cardId, index) => {
            const card = ownedCards.find((c) => c.id === cardId);
            return (
              <div key={index} className="aspect-[3/4]">
                {card ? (
                  <button onClick={() => toggleDeckCard(card.id)} className="block h-full w-full">
                    <CardFace card={card.template} variant="board" selected />
                  </button>
                ) : (
                  <div className="grid h-full place-items-center rounded-md border border-dashed border-line text-content-faint">
                    <Plus size={20} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Your cards" subtitle="Tap to add or remove" />
        <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4 md:grid-cols-6">
          {ownedCards.map((card) => {
            const selected = selectedDeckCards.includes(card.id);
            const full = selectedDeckCards.length >= 5 && !selected;
            return (
              <button
                key={card.id}
                onClick={() => toggleDeckCard(card.id)}
                disabled={full}
                className={clsx(
                  "rounded-md transition-transform",
                  selected && "ring-2 ring-accent",
                  full ? "opacity-40" : "hover:-translate-y-1"
                )}
              >
                <CardFace card={card.template} variant="hand" selected={selected} />
              </button>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
