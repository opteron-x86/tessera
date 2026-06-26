"use client";

import { Coins, PackageOpen, Sparkles } from "lucide-react";
import { CardFace } from "@/components/game/card-face";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { BOOSTER_PACKS } from "@/game/content";
import { useTessera } from "@/lib/client/store";

export function ShopScreen() {
  const { status, openedCards, openPack } = useTessera();
  const canBuy = status === "authenticated";

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
        {BOOSTER_PACKS.map((pack) => (
          <Panel key={pack.id} className="flex flex-col p-5">
            <div className="mb-3 grid h-28 place-items-center rounded-md border border-line bg-gradient-to-br from-accent/20 to-[var(--affinity-eldritch)]/15">
              <PackageOpen size={40} className="text-accent" />
            </div>
            <h3 className="font-display text-lg font-semibold">{pack.name}</h3>
            <p className="mt-1 flex-1 text-sm text-content-muted">{pack.description}</p>
            <Button variant="gold" disabled={!canBuy} className="mt-4" onClick={() => openPack(pack.id)}>
              <Coins size={16} /> {pack.price}
            </Button>
          </Panel>
        ))}
      </div>

      {openedCards.length > 0 && (
        <Panel>
          <PanelHeader title="Last opened" />
          <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-5">
            {openedCards.map((card, index) => (
              <div key={`${card.id}-${index}`} className="animate-pop" style={{ animationDelay: `${index * 90}ms` }}>
                <CardFace card={card} variant="reveal" />
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
