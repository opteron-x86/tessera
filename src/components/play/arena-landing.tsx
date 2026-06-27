"use client";

import clsx from "clsx";
import { Bot, ChevronRight, Coins, Crown, PlayCircle, Wifi } from "lucide-react";
import Link from "next/link";
import { PVE_OPPONENTS } from "@/game/content";
import { useTessera } from "@/lib/client/store";

function ModeCard({
  href,
  icon: Icon,
  title,
  blurb,
  accent
}: {
  href: string;
  icon: typeof Bot;
  title: string;
  blurb: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-lg border border-line bg-surface p-6 shadow-e1 transition-colors duration-fast hover:border-line-strong hover:bg-surface-2"
    >
      <span
        className="grid h-12 w-12 place-items-center rounded-md"
        style={{ background: `color-mix(in srgb, ${accent} 18%, transparent)`, color: accent }}
      >
        <Icon size={26} />
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-xl font-bold">{title}</h3>
        <p className="mt-1 text-sm text-content-muted">{blurb}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-accent">
        Enter <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function ArenaLanding() {
  const { game, pvpState, opponentId, playerCurrency } = useTessera();

  const pveLive = game.phase === "active";
  const pvpLive = pvpState?.phase === "active";
  const resumeMode: "pve" | "pvp" | null = pvpLive ? "pvp" : pveLive ? "pve" : null;
  const opponentName =
    PVE_OPPONENTS.find((opponent) => opponent.id === opponentId)?.name ?? "your opponent";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Duel Arena</h1>
          <p className="mt-1 text-sm text-content-muted">Choose your battle.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 px-3 py-1.5 text-sm font-semibold tabular-nums text-gold">
          <Coins size={15} />
          {playerCurrency}
        </span>
      </header>

      {resumeMode && (
        <Link
          href="/play/duel"
          className={clsx(
            "flex items-center justify-between gap-3 rounded-lg border border-accent/50 bg-accent/10 px-5 py-4",
            "transition-colors duration-fast hover:bg-accent/15"
          )}
        >
          <span className="flex items-center gap-3">
            <PlayCircle size={22} className="text-accent" />
            <span>
              <span className="block font-display font-semibold">Resume duel</span>
              <span className="block text-sm text-content-muted">
                {resumeMode === "pve" ? `vs ${opponentName}` : "Live match in progress"}
              </span>
            </span>
          </span>
          <ChevronRight size={18} className="text-accent" />
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <ModeCard
          href="/play/pve"
          icon={Bot}
          title="Versus AI"
          blurb="Climb the opponent ladder. Win to earn currency and unlock tougher duels."
          accent="var(--player-one)"
        />
        <ModeCard
          href="/play/pvp"
          icon={Wifi}
          title="Online Duel"
          blurb="Create a room or join with a code to play a live match against another wayfarer."
          accent="var(--gold)"
        />
      </div>

      <p className="flex items-center gap-1.5 text-xs text-content-faint">
        <Crown size={13} /> Highest reward right now:{" "}
        {Math.max(...PVE_OPPONENTS.map((opponent) => opponent.rewardCurrency))} currency
      </p>
    </div>
  );
}
