"use client";

import { Coins, Loader2, PackageOpen, Sparkles } from "lucide-react";
import { useState } from "react";
import { CardFace } from "@/components/game/card-face";
import { PackReveal } from "@/components/shop/pack-reveal";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { BOOSTER_PACKS } from "@/game/content";
import type { BoosterPack, CardRarity } from "@/game/types";
import { rarityColor } from "@/lib/client/cards";
import { useTessera, type OpenedCard } from "@/lib/client/store";

const RARITY_LABEL: Record<CardRarity, string> = {
  COMMON: "Common",
  UNCOMMON: "Uncommon",
  RARE: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary"
};

const RARITY_ORDER: Record<CardRarity, number> = {
  COMMON: 0,
  UNCOMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4
};

export function ShopScreen() {
  const { status, openedCards, openPack, playerCurrency } = useTessera();
  const canBuy = status === "authenticated";
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [reveal, setReveal] = useState<OpenedCard[] | null>(null);

  async function buy(pack: BoosterPack) {
    if (pendingId) return;
    setPendingId(pack.id);
    const opened = await openPack(pack.id);
    setPendingId(null);
    if (opened && opened.length > 0) setReveal(opened);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="heading font-display text-2xl font-bold">Shop</h1>
        <Sparkles size={20} className="text-gold" />
      </div>

      {!canBuy && (
        <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-content-muted">
          Sign in on the Profile tab to buy boosters.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {BOOSTER_PACKS.map((pack) => {
          const pending = pendingId === pack.id;
          const affordable = playerCurrency >= pack.price;
          const disabled = !canBuy || pending || (canBuy && !affordable);
          const cardCount = pack.slots.reduce((total, slot) => total + slot.count, 0);
          return (
            <Panel key={pack.id} className="flex flex-col p-5">
              <div className="mb-3 grid h-28 place-items-center rounded-md border border-line bg-gradient-to-br from-accent/20 to-[var(--affinity-eldritch)]/15">
                <PackageOpen size={40} className="text-accent" />
              </div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">{pack.name}</h3>
                <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-content-faint">
                  {cardCount} cards
                </span>
              </div>
              <p className="mt-1 text-sm text-content-muted">{pack.description}</p>

              <PackContents pack={pack} />

              <Button
                variant="gold"
                disabled={disabled}
                className="mt-4"
                onClick={() => void buy(pack)}
              >
                {pending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Opening…
                  </>
                ) : (
                  <>
                    <Coins size={16} /> {pack.price}
                  </>
                )}
              </Button>
              {canBuy && !affordable && !pending && (
                <p className="mt-1.5 text-center text-xs text-danger">
                  Need {pack.price - playerCurrency} more
                </p>
              )}
            </Panel>
          );
        })}
      </div>

      {openedCards.length > 0 && (
        <Panel>
          <PanelHeader title="Last pull" />
          <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-5">
            {openedCards.map((card, index) => (
              <div key={`${card.template.id}-${index}`} className="relative">
                <CardFace card={card.template} variant="reveal" />
                {card.isNew && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full border border-gold bg-gold px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#0b0d12]">
                    New
                  </span>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {reveal && <PackReveal cards={reveal} onClose={() => setReveal(null)} />}
    </div>
  );
}

/** Guaranteed rarity floor + upgrade odds, derived from the pack's slots. */
function PackContents({ pack }: { pack: BoosterPack }) {
  const floor = new Map<CardRarity, number>();
  for (const slot of pack.slots) {
    floor.set(slot.rarity, (floor.get(slot.rarity) ?? 0) + slot.count);
  }
  const upgrades = pack.slots.flatMap((slot) =>
    Object.entries(slot.chanceUpgrades ?? {}).map(([rarity, chance]) => ({
      rarity: rarity as CardRarity,
      chance: chance ?? 0
    }))
  );
  // The "ceiling" — the rarest a pull can upgrade to, not the most likely.
  const bestUpgrade = upgrades.reduce<{ rarity: CardRarity; chance: number } | null>(
    (best, entry) =>
      !best || RARITY_ORDER[entry.rarity] > RARITY_ORDER[best.rarity] ? entry : best,
    null
  );

  return (
    <div className="mt-3 flex flex-1 flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {[...floor.entries()].map(([rarity, count]) => (
          <span
            key={rarity}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-xs font-medium"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: rarityColor(rarity) }} />
            {count}× {RARITY_LABEL[rarity]}
          </span>
        ))}
      </div>
      {bestUpgrade && (
        <p className="text-xs text-content-faint">
          Up to{" "}
          <span className="font-semibold" style={{ color: rarityColor(bestUpgrade.rarity) }}>
            {RARITY_LABEL[bestUpgrade.rarity]}
          </span>{" "}
          on lucky pulls.
        </p>
      )}
    </div>
  );
}
