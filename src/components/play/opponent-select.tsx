"use client";

import clsx from "clsx";
import { ArrowLeft, Crown, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RulePills } from "@/components/game/rule-pills";
import { PVE_OPPONENTS } from "@/game/content";
import { useTessera } from "@/lib/client/store";

const DIFFICULTY_LABELS = ["", "Novice", "Adept", "Veteran", "Master", "Mythic"];

function difficultyLabel(difficulty: number) {
  return DIFFICULTY_LABELS[difficulty] ?? `Tier ${difficulty}`;
}

function affinityColor(affinity?: string) {
  return affinity ? `var(--affinity-${affinity.toLowerCase()})` : "var(--player-two)";
}

export function OpponentSelect() {
  const router = useRouter();
  const { resetLocalGame, isOpponentUnlocked, pveProgress, opponentId, setDuelMode, status } =
    useTessera();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function pick(id: string) {
    if (pendingId) {
      return;
    }
    setPendingId(id);
    setDuelMode("pve");

    // Local play sets the active game synchronously, so we can enter the duel
    // immediately and let the coin flip / AI opening animate on the board. The
    // authenticated path must await the server-created match before navigating.
    if (status === "authenticated") {
      try {
        await resetLocalGame(id);
      } catch {
        setPendingId(null);
        return;
      }
    } else {
      void resetLocalGame(id);
    }
    router.push("/play/duel");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 py-4">
      <header className="flex items-center gap-3">
        <Link
          href="/play"
          aria-label="Back to arena"
          className="grid h-9 w-9 place-items-center rounded-md border border-line text-content-muted transition-colors hover:bg-surface-2 hover:text-content"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">Choose an opponent</h1>
          <p className="text-sm text-content-muted">Defeat each duelist to unlock the next.</p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {PVE_OPPONENTS.map((opponent) => {
          const active = opponent.id === opponentId;
          const unlocked = isOpponentUnlocked(opponent.id);
          const progress = pveProgress.find((entry) => entry.opponentId === opponent.id);
          const pending = pendingId === opponent.id;
          const sigilColor = affinityColor(opponent.deckAffinity);

          return (
            <button
              key={opponent.id}
              disabled={!unlocked || Boolean(pendingId)}
              onClick={() => void pick(opponent.id)}
              className={clsx(
                "relative flex flex-col gap-3 rounded-lg border p-4 text-left transition-colors duration-fast",
                active && unlocked
                  ? "border-accent bg-accent/10"
                  : "border-line bg-surface hover:border-line-strong hover:bg-surface-2",
                !unlocked && "cursor-not-allowed opacity-55 hover:border-line hover:bg-surface",
                pendingId && !pending && "opacity-60"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-md font-display text-lg font-bold"
                  style={{
                    background: `color-mix(in srgb, ${sigilColor} 20%, transparent)`,
                    color: sigilColor
                  }}
                  aria-hidden
                >
                  {opponent.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display font-semibold leading-tight">{opponent.name}</h3>
                    {unlocked ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-gold">
                        <Crown size={14} /> {opponent.rewardCurrency}
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-content-faint">
                        <Lock size={14} /> Locked
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-content-faint">
                    {difficultyLabel(opponent.difficulty)}
                    {opponent.deckAffinity ? ` · ${opponent.deckAffinity}` : ""}
                  </p>
                </div>
              </div>

              <p className="text-sm text-content-muted">{opponent.tutorialCopy}</p>

              {progress && (
                <p className="text-xs font-semibold uppercase tracking-wide text-content-faint">
                  {progress.completedAt
                    ? `${progress.wins} win${progress.wins === 1 ? "" : "s"}`
                    : "Attempted"}{" "}
                  · Best {progress.bestScore ?? 0}
                </p>
              )}

              <RulePills rules={opponent.ruleSet} />

              {pending && (
                <span className="absolute inset-0 grid place-items-center rounded-lg bg-surface/70 backdrop-blur-sm">
                  <Loader2 size={22} className="animate-spin text-accent" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
