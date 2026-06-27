"use client";

import clsx from "clsx";
import { Layers, Recycle, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { CardFilterBar } from "@/components/cards/card-filter-bar";
import {
  groupAndFilterCards,
  listAffinities,
  type CardGroup,
  type CardSort
} from "@/components/cards/filter";
import { CardFace } from "@/components/game/card-face";
import { ActionBar } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Overlay } from "@/components/ui/overlay";
import { Badge, Panel } from "@/components/ui/panel";
import { transmuteValue } from "@/game/transmute";
import type { CardInstance, CardRarity } from "@/game/types";
import { formatSides, rarityColor } from "@/lib/client/cards";
import { useTessera } from "@/lib/client/store";

type TransmuteInfo = {
  target: CardInstance | null;
  value: number;
  blocked: boolean;
  isLastCopy: boolean;
};

function transmuteInfo(group: CardGroup, deckIds: Set<string>, enforceDeck: boolean): TransmuteInfo {
  const candidates = enforceDeck
    ? group.instances.filter((card) => !deckIds.has(card.id))
    : group.instances;
  const target = [...candidates].sort((a, b) => a.upgradeLevel - b.upgradeLevel)[0] ?? null;
  return {
    target,
    value: target ? transmuteValue(group.template.rarity, target.upgradeLevel) : 0,
    blocked: !target,
    isLastCopy: group.instances.length === 1
  };
}

export function CollectionScreen() {
  const { ownedCards, transmute, snapshotLoading, status, activeDeckCards } = useTessera();
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState<CardRarity | "ALL">("ALL");
  const [affinity, setAffinity] = useState<string>("ALL");
  const [sort, setSort] = useState<CardSort>("name");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const enforceDeck = status === "authenticated";
  const deckIds = useMemo(() => new Set(activeDeckCards.map((card) => card.id)), [activeDeckCards]);
  const affinities = useMemo(() => listAffinities(ownedCards), [ownedCards]);
  const groups = useMemo(
    () => groupAndFilterCards(ownedCards, { query, rarity, affinity, sort }),
    [ownedCards, query, rarity, affinity, sort]
  );

  const active = groups.find((group) => group.template.id === activeId) ?? groups[0] ?? null;
  const confirmGroup = groups.find((group) => group.template.id === confirmId) ?? null;
  const uniqueCount = useMemo(
    () => new Set(ownedCards.map((card) => card.template.id)).size,
    [ownedCards]
  );

  function select(group: CardGroup) {
    setActiveId(group.template.id);
    setSheetOpen(true);
  }

  function requestTransmute(group: CardGroup | null) {
    if (group) setConfirmId(group.template.id);
  }

  function confirmTransmute() {
    if (!confirmGroup) return;
    const info = transmuteInfo(confirmGroup, deckIds, enforceDeck);
    if (info.target) void transmute(info.target.id);
    setConfirmId(null);
    setSheetOpen(false);
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="heading font-display text-2xl font-bold">Collection</h1>
        <span className="text-sm text-content-muted tabular-nums">
          {uniqueCount} unique · {ownedCards.length} total
        </span>
      </div>

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

      {/* grid + desktop detail */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="scroll-thin min-h-0 overflow-y-auto">
          {snapshotLoading && groups.length === 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[3/4]" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No cards match"
              description="Try a different filter or open a pack."
            />
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {groups.map((group) => {
                const selected = active?.template.id === group.template.id;
                const count = group.instances.length;
                return (
                  <li key={group.template.id}>
                    <button
                      onClick={() => select(group)}
                      aria-pressed={selected}
                      aria-label={`${group.template.name}${count > 1 ? `, ${count} owned` : ""}`}
                      className="group relative block w-full transition-transform duration-fast hover:-translate-y-0.5"
                    >
                      <CardFace
                        card={group.template}
                        variant="hand"
                        selected={selected}
                        className="w-full"
                      />
                      {count > 1 && (
                        <Badge className="absolute right-1.5 top-1.5 border-line-strong bg-surface/85 tabular-nums backdrop-blur-sm">
                          ×{count}
                        </Badge>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* desktop detail panel */}
        <Panel flourish className="hidden flex-col lg:flex">
          {active ? (
            <CardDetail
              key={active.template.id}
              group={active}
              info={transmuteInfo(active, deckIds, enforceDeck)}
              onTransmute={() => requestTransmute(active)}
            />
          ) : (
            <div className="grid flex-1 place-items-center p-6 text-center text-sm text-content-faint">
              Select a card to inspect it.
            </div>
          )}
        </Panel>
      </div>

      <ActionBar
        className="hidden border-t border-line pt-3 lg:flex"
        actions={[
          {
            keys: ["E"],
            label: "Transmute",
            onClick: active ? () => requestTransmute(active) : undefined
          }
        ]}
      />

      {/* mobile detail sheet */}
      <div className="lg:hidden">
        <Overlay open={sheetOpen} onClose={() => setSheetOpen(false)} title={active?.template.name}>
          {active && (
            <CardDetail
              group={active}
              info={transmuteInfo(active, deckIds, enforceDeck)}
              onTransmute={() => requestTransmute(active)}
              embedded
            />
          )}
        </Overlay>
      </div>

      {/* transmute confirmation */}
      <Overlay open={Boolean(confirmGroup)} onClose={() => setConfirmId(null)} title="Transmute card?">
        {confirmGroup && (
          <ConfirmTransmute
            group={confirmGroup}
            info={transmuteInfo(confirmGroup, deckIds, enforceDeck)}
            onCancel={() => setConfirmId(null)}
            onConfirm={confirmTransmute}
          />
        )}
      </Overlay>
    </div>
  );
}

function CardDetail({
  group,
  info,
  onTransmute,
  embedded = false
}: {
  group: CardGroup;
  info: TransmuteInfo;
  onTransmute: () => void;
  embedded?: boolean;
}) {
  const { template } = group;
  return (
    <>
      {!embedded && (
        <div className="plate px-4 py-2.5">
          <h2 className="heading font-display text-lg font-semibold">{template.name}</h2>
        </div>
      )}
      <div className={clsx("flex flex-1 flex-col gap-4", embedded ? "" : "p-4")}>
        <div className="mx-auto w-32">
          <CardFace card={template} variant="hand" />
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line text-sm">
          <Stat label="Affinity" value={template.affinity ?? "—"} />
          <Stat label="Rarity" value={template.rarity} color={rarityColor(template.rarity)} />
          <Stat label="Tier" value={String(template.tier)} />
          <Stat label="Series" value={template.series} />
          <Stat label="Sides" value={formatSides(template.sides)} />
          <Stat label="Owned" value={String(group.instances.length)} />
        </div>
        <p className="flex-1 text-sm italic leading-relaxed text-content-muted">{template.lore}</p>
        {info.blocked ? (
          <p className="flex items-center gap-2 rounded-md border border-line bg-surface-2 px-3 py-2.5 text-sm text-content-muted">
            <TriangleAlert size={15} className="shrink-0 text-warning" />
            {info.isLastCopy
              ? "In your active deck — cannot transmute."
              : "All copies are in your active deck."}
          </p>
        ) : (
          <Button variant="accent" onClick={onTransmute}>
            <Recycle size={16} /> Transmute · +{info.value}
          </Button>
        )}
      </div>
    </>
  );
}

function ConfirmTransmute({
  group,
  info,
  onCancel,
  onConfirm
}: {
  group: CardGroup;
  info: TransmuteInfo;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {info.blocked ? (
        <p className="text-sm text-content-muted">
          Every copy of <span className="font-semibold text-content">{group.template.name}</span> is
          in your active deck. Remove it from the deck first to transmute it.
        </p>
      ) : (
        <>
          <p className="text-sm text-content-muted">
            Transmute one copy of{" "}
            <span className="font-semibold text-content">{group.template.name}</span> for{" "}
            <span className="font-semibold text-gold">+{info.value} currency</span>? This permanently
            destroys the card.
          </p>
          {info.isLastCopy && (
            <p className="flex items-center gap-2 text-sm text-warning">
              <TriangleAlert size={15} className="shrink-0" /> This is your last copy.
            </p>
          )}
        </>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="accent" onClick={onConfirm} disabled={info.blocked}>
          <Recycle size={16} /> Transmute
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-surface-2 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-content-faint">{label}</p>
      <p className="font-semibold tabular-nums" style={color ? { color } : undefined}>
        {value}
      </p>
    </div>
  );
}
