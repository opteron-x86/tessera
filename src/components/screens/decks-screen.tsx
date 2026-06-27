"use client";

import clsx from "clsx";
import { FilePlus2, Layers, Plus, Save, Star, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CardFilterBar } from "@/components/cards/card-filter-bar";
import {
  groupAndFilterCards,
  listAffinities,
  type CardGroup,
  type CardSort
} from "@/components/cards/filter";
import { CardFace } from "@/components/game/card-face";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Badge, Panel } from "@/components/ui/panel";
import type { CardInstance, CardRarity } from "@/game/types";
import { affinityColor, normalizeSides } from "@/lib/client/cards";
import { useTessera } from "@/lib/client/store";

const DECK_SIZE = 5;

function cardPower(card: CardInstance) {
  const sides = normalizeSides(card.template.sides);
  return sides.top + sides.right + sides.bottom + sides.left;
}

export function DecksScreen() {
  const {
    ownedCards,
    selectedDeckCards,
    toggleDeckCard,
    clearDeck,
    saveCurrentDeck,
    decks,
    activeDeckId,
    setActiveDeckId,
    editingDeckId,
    editDeck,
    newDeck,
    deckDraftName,
    setDeckDraftName,
    deckSlots,
    status
  } = useTessera();

  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState<CardRarity | "ALL">("ALL");
  const [affinity, setAffinity] = useState<string>("ALL");
  const [sort, setSort] = useState<CardSort>("name");

  const authed = status === "authenticated";
  const selectedSet = useMemo(() => new Set(selectedDeckCards), [selectedDeckCards]);
  const affinities = useMemo(() => listAffinities(ownedCards), [ownedCards]);
  const groups = useMemo(
    () => groupAndFilterCards(ownedCards, { query, rarity, affinity, sort }),
    [ownedCards, query, rarity, affinity, sort]
  );

  const deckCards = useMemo(
    () =>
      selectedDeckCards
        .map((id) => ownedCards.find((card) => card.id === id))
        .filter((card): card is CardInstance => Boolean(card)),
    [selectedDeckCards, ownedCards]
  );

  const valid = selectedDeckCards.length === DECK_SIZE;
  const savedDeck = decks.find((deck) => deck.id === editingDeckId) ?? null;
  const dirty = useMemo(() => {
    if (!savedDeck) return selectedDeckCards.length > 0;
    if (deckDraftName.trim() !== savedDeck.name) return true;
    const savedIds = savedDeck.cards.map((slot) => slot.card.id);
    if (savedIds.length !== selectedDeckCards.length) return true;
    const set = new Set(savedIds);
    return selectedDeckCards.some((id) => !set.has(id));
  }, [savedDeck, selectedDeckCards, deckDraftName]);

  const avgPower = deckCards.length
    ? Math.round(deckCards.reduce((total, card) => total + cardPower(card), 0) / deckCards.length)
    : 0;
  const affinityCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const card of deckCards) {
      const key = card.template.affinity ?? "Neutral";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [deckCards]);

  const canCreateNew = decks.length < deckSlots;

  /** Add the next unused copy of a template, or remove one if it's already maxed in. */
  function togglePoolGroup(group: CardGroup) {
    const available = group.instances.find((card) => !selectedSet.has(card.id));
    if (available && selectedDeckCards.length < DECK_SIZE) {
      toggleDeckCard(available.id);
      return;
    }
    const used = group.instances.filter((card) => selectedSet.has(card.id));
    if (used.length > 0) toggleDeckCard(used[used.length - 1]!.id);
  }

  const slots = Array.from({ length: DECK_SIZE }, (_, index) => selectedDeckCards[index]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="heading font-display text-2xl font-bold">Deck Builder</h1>
        {authed && (
          <span className="text-sm text-content-muted tabular-nums">
            {decks.length}/{deckSlots} decks
          </span>
        )}
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* card pool */}
        <div className="order-2 flex min-h-0 flex-col gap-3 lg:order-1">
          <CardFilterBar
            query={query}
            rarity={rarity}
            affinity={affinity}
            sort={sort}
            affinities={affinities}
            onQuery={setQuery}
            onRarity={setRarity}
            onAffinity={setAffinity}
            onSort={setSort}
          />
          <div className="scroll-thin min-h-0 overflow-y-auto">
            {groups.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No cards match"
                description="Try a different filter or open a pack."
              />
            ) : (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
                {groups.map((group) => {
                  const owned = group.instances.length;
                  const used = group.instances.filter((card) => selectedSet.has(card.id)).length;
                  const inDeck = used > 0;
                  const maxed = used >= owned;
                  const blocked = maxed && selectedDeckCards.length >= DECK_SIZE;
                  return (
                    <li key={group.template.id}>
                      <button
                        onClick={() => togglePoolGroup(group)}
                        aria-label={`${group.template.name}, ${used} of ${owned} in deck`}
                        className={clsx(
                          "group relative block w-full rounded-md transition-transform duration-fast",
                          inDeck ? "ring-2 ring-accent" : !blocked && "hover:-translate-y-1",
                          blocked && "opacity-40"
                        )}
                      >
                        <CardFace card={group.template} variant="hand" selected={inDeck} />
                        <Badge className="absolute right-1.5 top-1.5 border-line-strong bg-surface/85 tabular-nums backdrop-blur-sm">
                          {used}/{owned}
                        </Badge>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* active deck sidebar */}
        <aside className="order-1 flex flex-col gap-3 lg:order-2">
          {authed && (
            <Panel className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between">
                <h2 className="heading text-xs font-semibold uppercase tracking-wide text-content-faint">
                  Your decks
                </h2>
                <button
                  onClick={newDeck}
                  disabled={!canCreateNew}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent disabled:opacity-40"
                >
                  <FilePlus2 size={14} /> New
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {decks.length === 0 && (
                  <span className="text-xs text-content-faint">No saved decks yet.</span>
                )}
                {decks.map((deck) => {
                  const isEditing = deck.id === editingDeckId;
                  const isActive = deck.id === activeDeckId;
                  return (
                    <div
                      key={deck.id}
                      className={clsx(
                        "flex items-center gap-1 rounded-md border pl-2.5 pr-1 text-sm transition-colors",
                        isEditing ? "border-accent bg-accent/10" : "border-line hover:border-line-strong"
                      )}
                    >
                      <button onClick={() => editDeck(deck.id)} className="py-1.5 font-medium">
                        {deck.name}
                      </button>
                      <button
                        onClick={() => setActiveDeckId(deck.id)}
                        aria-label={isActive ? "Active deck" : "Set as active deck"}
                        title={isActive ? "Active deck" : "Set as active"}
                        className="grid h-6 w-6 place-items-center text-content-faint hover:text-gold"
                      >
                        <Star size={14} className={isActive ? "fill-gold text-gold" : undefined} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          <Panel className="flex flex-col gap-3 p-3">
            <Input
              value={deckDraftName}
              onChange={(event) => setDeckDraftName(event.target.value)}
              placeholder="Deck name"
              maxLength={48}
              aria-label="Deck name"
              className="font-display font-semibold"
            />

            {/* validity pips */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: DECK_SIZE }, (_, index) => (
                  <span
                    key={index}
                    className={clsx(
                      "h-1.5 flex-1 rounded-full",
                      index < selectedDeckCards.length ? "bg-accent" : "bg-surface-3"
                    )}
                    style={{ width: 18 }}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-content-muted tabular-nums">
                {selectedDeckCards.length}/{DECK_SIZE}
              </span>
            </div>

            {/* tray */}
            <div className="grid grid-cols-5 gap-2">
              {slots.map((cardId, index) => {
                const card = deckCards.find((entry) => entry.id === cardId);
                return (
                  <div key={index} className="aspect-[3/4]">
                    {card ? (
                      <button
                        onClick={() => toggleDeckCard(card.id)}
                        aria-label={`Remove ${card.template.name}`}
                        className="group relative block h-full w-full"
                      >
                        <CardFace card={card.template} variant="board" selected />
                        <span className="absolute inset-0 grid place-items-center rounded-md bg-danger/0 opacity-0 transition-opacity group-hover:bg-danger/40 group-hover:opacity-100">
                          <X size={16} className="text-white" />
                        </span>
                      </button>
                    ) : (
                      <div className="grid h-full place-items-center rounded-md border border-dashed border-line text-content-faint">
                        <Plus size={18} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* deck stats */}
            {deckCards.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-line pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-content-muted">Avg power</span>
                  <span className="font-semibold tabular-nums">{avgPower}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {affinityCounts.map(([name, count]) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-xs"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: affinityColor(name === "Neutral" ? undefined : name) }}
                      />
                      {name} {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={clearDeck}
                disabled={selectedDeckCards.length === 0}
                className="px-3"
                aria-label="Clear deck"
              >
                <Trash2 size={16} />
              </Button>
              <Button
                variant="accent"
                onClick={saveCurrentDeck}
                disabled={!valid || !dirty}
                className="flex-1"
              >
                <Save size={16} /> {dirty ? "Save deck" : "Saved"}
              </Button>
            </div>
            {!valid && (
              <p className="text-center text-xs text-content-faint">
                Add {DECK_SIZE - selectedDeckCards.length} more card
                {DECK_SIZE - selectedDeckCards.length === 1 ? "" : "s"} to save.
              </p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
