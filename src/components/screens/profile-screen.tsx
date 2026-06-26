"use client";

import { Coins, Layers, LogOut, RefreshCcw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useTessera } from "@/lib/client/store";

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-line bg-surface-2 px-4 py-3">
      <Icon size={18} />
      <div>
        <p className="text-xs uppercase tracking-wide text-content-muted">{label}</p>
        <p className="font-display text-lg font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export function ProfileScreen() {
  const store = useTessera();
  const authed = store.status === "authenticated";

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h1 className="heading font-display text-2xl font-bold">Profile</h1>

      <Panel>
        <PanelHeader title={authed ? (store.session?.user?.name ?? "Wayfarer") : "Sign in"} />
        <div className="p-4">
          {authed ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Stat icon={Coins} label="Currency" value={store.playerCurrency} />
                <Stat icon={Layers} label="Cards" value={store.ownedCards.length} />
                <Stat icon={Wallet} label="Deck slots" value={store.deckSlots} />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={store.refreshSnapshot}>
                  <RefreshCcw size={15} /> Sync
                </Button>
                <Button variant="danger" onClick={store.logout}>
                  <LogOut size={15} /> Log out
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Input
                value={store.loginName}
                onChange={(event) => store.setLoginName(event.target.value)}
                placeholder="Name"
              />
              <Input
                value={store.loginEmail}
                onChange={(event) => store.setLoginEmail(event.target.value)}
                placeholder="Email"
              />
              <Button variant="accent" onClick={store.handleLogin}>
                Sign in
              </Button>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
