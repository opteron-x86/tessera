"use client";

import clsx from "clsx";
import { Layers, Recycle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CardFace } from "@/components/game/card-face";
import { ActionBar } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Panel, PanelHeader } from "@/components/ui/panel";
import type { CardInstance, CardRarity } from "@/game/types";
import { formatSides, rarityColor } from "@/lib/client/cards";
import { useTessera } from "@/lib/client/store";

const RARITIES: Array<CardRarity | "ALL"> = ["ALL", "COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];

type Group = { template: CardInstance["template"]; ids: string[] };

export function CollectionScreen() {
  const { ownedCards, transmute } = useTessera();
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState<CardRarity | "ALL">("ALL");
  const [activeId, setActiveId] = useState<string | null>(null);

  const groups = useMemo<Group[]>(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<string, Group>();
    for (const card of ownedCards) {
      if (rarity !== "ALL" && card.template.rarity !== rarity) continue;
      if (q && !card.template.name.toLowerCase().includes(q)) continue;
      const group = map.get(card.template.id) ?? { template: card.template, ids: [] };
      group.ids.push(card.id);
      map.set(card.template.id, group);
    }
    return [...map.values()].sort((a, b) => a.template.name.localeCompare(b.template.name));
  }, [ownedCards, query, rarity]);

  const active = groups.find((group) => group.template.id === activeId) ?? groups[0] ?? null;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="heading font-display text-2xl font-bold">Collection</h1>
        <span className="text-sm text-content-muted">{ownedCards.length} owned</span>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* inventory list */}
        <Panel flourish className="flex min-h-0 flex-col">
          <PanelHeader
            title="Cards"
            action={
              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-faint" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Filter"
                    className="h-8 w-40 pl-8 text-sm"
                  />
                </div>
              </div>
            }
          />

          <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-2">
            {RARITIES.map((value) => (
              <button
                key={value}
                onClick={() => setRarity(value)}
                className={clsx(
                  "heading border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  rarity === value
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-transparent text-content-faint hover:text-content"
                )}
              >
                {value}
              </button>
            ))}
          </div>

          {/* column header */}
          <div className="grid grid-cols-[1fr_5rem_3rem_4rem] gap-2 border-b border-line px-4 py-1.5 text-[11px] uppercase tracking-wide text-content-faint">
            <span>Name</span>
            <span>Affinity</span>
            <span className="text-right">Tier</span>
            <span className="text-right">Sides</span>
          </div>

          {groups.length === 0 ? (
            <EmptyState icon={Layers} title="No cards match" description="Try a different filter or open a pack." />
          ) : (
            <ul className="scroll-thin min-h-0 flex-1 overflow-y-auto">
              {groups.map((group) => {
                const selected = active?.template.id === group.template.id;
                return (
                  <li key={group.template.id}>
                    <button
                      onClick={() => setActiveId(group.template.id)}
                      className={clsx(
                        "grid w-full grid-cols-[1fr_5rem_3rem_4rem] items-center gap-2 px-4 py-2 text-left text-sm transition-colors",
                        selected ? "row-select text-content" : "hover:bg-surface-2"
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <img
                          src={group.template.artUrl ?? "/cards/card-back.svg"}
                          alt=""
                          className="h-6 w-6 shrink-0 rounded-sm object-cover"
                          style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.6))" }}
                        />
                        <span className="truncate font-medium">
                          {group.template.name}
                          {group.ids.length > 1 && (
                            <span className="text-content-muted"> ({group.ids.length})</span>
                          )}
                        </span>
                      </span>
                      <span className="text-content-muted">{group.template.affinity ?? "—"}</span>
                      <span className="text-right tabular-nums text-content-muted">{group.template.tier}</span>
                      <span className="text-right tabular-nums text-content-muted">
                        {formatSides(group.template.sides)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* detail name-plate */}
        <Panel flourish className="hidden flex-col lg:flex">
          {active ? (
            <CardDetail key={active.template.id} group={active} onTransmute={() => transmute(active.ids[0]!)} />
          ) : (
            <div className="grid flex-1 place-items-center p-6 text-center text-sm text-content-faint">
              Select a card to inspect it.
            </div>
          )}
        </Panel>
      </div>

      <ActionBar
        className="border-t border-line pt-3"
        actions={[
          {
            keys: ["E"],
            label: "Transmute",
            onClick: active ? () => transmute(active.ids[0]!) : undefined
          },
          { keys: ["F"], label: "Filter" }
        ]}
      />
    </div>
  );
}

function CardDetail({ group, onTransmute }: { group: Group; onTransmute: () => void }) {
  const { template } = group;
  return (
    <>
      <div className="plate px-4 py-2.5">
        <h2 className="heading font-display text-lg font-semibold">{template.name}</h2>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="mx-auto w-32">
          <CardFace card={template} variant="hand" />
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line text-sm">
          <Stat label="Affinity" value={template.affinity ?? "—"} />
          <Stat label="Rarity" value={template.rarity} color={rarityColor(template.rarity)} />
          <Stat label="Tier" value={String(template.tier)} />
          <Stat label="Series" value={template.series} />
          <Stat label="Sides" value={formatSides(template.sides)} />
          <Stat label="Owned" value={String(group.ids.length)} />
        </div>
        <p className="flex-1 text-sm italic leading-relaxed text-content-muted">{template.lore}</p>
        <Button variant="accent" onClick={onTransmute}>
          <Recycle size={16} /> Transmute
        </Button>
      </div>
    </>
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
