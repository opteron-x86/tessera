"use client";

import clsx from "clsx";
import { BookOpen, Coins, DoorOpen, RefreshCcw, ScrollText, Swords } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GameBoard, lastMoveAnimationSettleMs } from "@/components/game/board";
import { Hand } from "@/components/game/hand";
import { MatchLog } from "@/components/game/match-log";
import { OutcomeOverlay } from "@/components/game/outcome-overlay";
import { RulePills } from "@/components/game/rule-pills";
import { ScoreBar } from "@/components/game/score-bar";
import { Button } from "@/components/ui/button";
import { Overlay } from "@/components/ui/overlay";
import { PVE_OPPONENTS } from "@/game/content";
import type { GameState, PlayerSlot } from "@/game/types";
import { OPENING_FLIP_MS, OPENING_FLIP_SPIN_MS, useTessera } from "@/lib/client/store";

export function DuelScreen() {
  const store = useTessera();
  const router = useRouter();
  const [infoOpen, setInfoOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [openingFlipVisible, setOpeningFlipVisible] = useState(false);
  const [outcomeVisible, setOutcomeVisible] = useState(false);

  const usingPvp = store.duelMode === "pvp" && Boolean(store.pvpState);
  const game = usingPvp ? store.pvpState! : store.game;
  const youSlot: PlayerSlot = usingPvp && store.pvpSlot ? store.pvpSlot : "one";
  const oppSlot: PlayerSlot = youSlot === "one" ? "two" : "one";
  const yourHand = game.hands[youSlot];
  const oppHand = game.hands[oppSlot];
  const openRule = Boolean(game.rules.open);
  const canAct =
    game.phase === "active" &&
    !openingFlipVisible &&
    (usingPvp ? game.currentPlayer === store.pvpSlot : game.currentPlayer === "one");
  const onCell = usingPvp ? store.playPvp : store.playLocal;
  const reward = store.lastPveReward?.amount;
  const opponentName = usingPvp
    ? "Opponent"
    : (PVE_OPPONENTS.find((opponent) => opponent.id === store.opponentId)?.name ?? "Opponent");

  // No live duel here (e.g. direct navigation / after leaving) — back to the arena.
  const noDuel = store.game.phase === "lobby" && !store.pvpState;
  useEffect(() => {
    if (noDuel) {
      router.replace("/play");
    }
  }, [noDuel, router]);

  useEffect(() => {
    if (game.phase !== "active" || game.moveNumber !== 0) {
      setOpeningFlipVisible(false);
      return;
    }

    setOpeningFlipVisible(true);
    const timeout = window.setTimeout(() => setOpeningFlipVisible(false), OPENING_FLIP_MS);
    return () => window.clearTimeout(timeout);
  }, [game.id, game.moveNumber, game.phase, game.currentPlayer]);

  useEffect(() => {
    if (game.phase !== "complete") {
      setOutcomeVisible(false);
      return;
    }

    const delayMs = lastMoveAnimationSettleMs(game);
    if (delayMs === 0) {
      setOutcomeVisible(true);
      return;
    }

    setOutcomeVisible(false);
    const timeout = window.setTimeout(() => setOutcomeVisible(true), delayMs);
    return () => window.clearTimeout(timeout);
  }, [game]);

  if (noDuel) {
    return null;
  }

  function leaveGame() {
    setLeaveOpen(false);
    router.push("/play");
  }

  function requestLeave() {
    if (game.phase === "active") {
      setLeaveOpen(true);
    } else {
      leaveGame();
    }
  }

  const board = (
    <div className="relative shrink-0">
      <GameBoard
        game={game}
        selectedCardId={store.selectedCardId}
        canAct={canAct}
        onCellClick={onCell}
      />
      {outcomeVisible && (
        <OutcomeOverlay
          game={game}
          youSlot={youSlot}
          reward={usingPvp ? undefined : reward}
          onPlayAgain={() => {
            if (usingPvp) {
              router.push("/play/pvp");
            } else {
              void store.resetLocalGame();
            }
          }}
        />
      )}
      {openingFlipVisible && <OpeningFlipOverlay game={game} youSlot={youSlot} />}
    </div>
  );

  const handProps = {
    selectedCardId: store.selectedCardId,
    canAct,
    onSelect: store.setSelectedCardId
  };

  return (
    <div className="flex h-[100dvh] flex-col gap-2 overflow-hidden py-2 lg:gap-3 lg:px-6 lg:py-4">
      {/* duel header */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-3 lg:px-0">
        <Button size="sm" variant="danger" onClick={requestLeave}>
          <DoorOpen size={16} />
          <span className="hidden sm:inline">Leave game</span>
        </Button>

        <div className="flex min-w-0 items-center gap-2 text-content-muted">
          <Swords size={15} className="shrink-0" />
          <span className="truncate text-sm font-semibold text-content">{opponentName}</span>
        </div>

        <div className="flex items-center gap-2">
          {!usingPvp && (
            <Button size="sm" variant="ghost" onClick={() => void store.resetLocalGame()}>
              <RefreshCcw size={16} />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
          <Button size="sm" variant="ghost" className="xl:hidden" onClick={() => setInfoOpen(true)}>
            <BookOpen size={16} />
            <span className="hidden sm:inline">Match</span>
          </Button>
        </div>
      </div>

      {/* desktop: score sits over the board's top edge; hands flank the board, rail on xl */}
      <div
        className="hidden min-h-0 flex-1 items-center justify-center gap-6 lg:flex xl:gap-10"
        style={
          {
            "--card-w": "min(calc((100dvh - 13rem) / 4), 13vw)",
            "--hand-span": "calc(var(--card-w) * 4 + 2rem)"
          } as React.CSSProperties
        }
      >
        <Hand
          cards={yourHand}
          orientation="vertical"
          shift="right"
          owner={youSlot}
          label="Your hand"
          {...handProps}
        />
        <div className="flex min-h-0 flex-col items-center justify-center gap-3">
          <div className="w-full max-w-md">
            <ScoreBar game={game} youSlot={youSlot} />
          </div>
          {board}
        </div>
        <Hand
          cards={oppHand}
          orientation="vertical"
          shift="left"
          interactive={false}
          faceDown={!openRule}
          owner={oppSlot}
          label="Opponent hand"
          {...handProps}
        />
        <aside className="hidden h-full w-72 shrink-0 flex-col gap-4 overflow-y-auto scroll-thin rounded-lg border border-line bg-surface p-4 xl:flex">
          <section>
            <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold">
              <Swords size={15} /> Rules
            </h3>
            <RulePills rules={game.rules} />
          </section>
          <section className="min-h-0 flex-1">
            <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold">
              <ScrollText size={15} /> Match log
            </h3>
            <MatchLog game={game} />
          </section>
        </aside>
      </div>

      {/* mobile: score over the board, opponent hand on top, your hand on the bottom */}
      <div
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 lg:hidden"
        style={
          {
            "--card-w": "min(32vw, calc((100dvh - 8rem) / 7))",
            "--hand-span": "calc(var(--card-w) * 3 + 2rem)"
          } as React.CSSProperties
        }
      >
        <div className="w-full max-w-md">
          <ScoreBar game={game} youSlot={youSlot} />
        </div>
        <Hand
          cards={oppHand}
          orientation="horizontal"
          interactive={false}
          faceDown={!openRule}
          owner={oppSlot}
          label="Opponent hand"
          {...handProps}
        />
        {board}
        <Hand
          cards={yourHand}
          orientation="horizontal"
          shift="up"
          owner={youSlot}
          label="Your hand"
          {...handProps}
        />
      </div>

      {/* match rail as a sheet below xl */}
      <MatchInfoOverlay open={infoOpen} onClose={() => setInfoOpen(false)} game={game} />

      {/* leave confirmation */}
      <Overlay open={leaveOpen} onClose={() => setLeaveOpen(false)} title="Leave this duel?">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-content-muted">
            The match is still in progress. Leaving now forfeits it and returns you to the arena.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setLeaveOpen(false)}>
              Keep playing
            </Button>
            <Button variant="danger" onClick={leaveGame}>
              <DoorOpen size={16} /> Leave game
            </Button>
          </div>
        </div>
      </Overlay>
    </div>
  );
}

function OpeningFlipOverlay({ game, youSlot }: { game: GameState; youSlot: PlayerSlot }) {
  const [landed, setLanded] = useState(false);
  const youStart = game.currentPlayer === youSlot;
  const tone = youStart ? "var(--player-one)" : "var(--player-two)";

  useEffect(() => {
    setLanded(false);
    const timeout = window.setTimeout(() => setLanded(true), OPENING_FLIP_SPIN_MS);
    return () => window.clearTimeout(timeout);
  }, [game.id, game.currentPlayer]);

  return (
    <div className="absolute inset-0 z-20 grid place-items-center rounded-lg bg-black/55 backdrop-blur-sm">
      <div className="flex min-h-40 flex-col items-center justify-center gap-3 px-6 text-center">
        <Coins
          size={44}
          className={clsx(
            "text-gold transition-transform duration-300",
            landed ? "scale-110" : "animate-spin"
          )}
          style={{
            animationDuration: "450ms",
            color: landed ? tone : undefined
          }}
        />
        <div>
          <p className="heading text-xs font-semibold uppercase tracking-widest text-content-muted">
            Coin flip
          </p>
          {landed ? (
            <h2 className="animate-pop font-display text-2xl font-bold" style={{ color: tone }}>
              {youStart ? "You start" : "Opponent starts"}
            </h2>
          ) : (
            <div className="h-8" aria-hidden />
          )}
        </div>
      </div>
    </div>
  );
}

function MatchInfoOverlay({
  open,
  onClose,
  game
}: {
  open: boolean;
  onClose: () => void;
  game: GameState;
}) {
  return (
    <Overlay open={open} onClose={onClose} title="Match">
      <div className="flex flex-col gap-5">
        <section>
          <h3 className="mb-2 flex items-center gap-2 font-display font-semibold">
            <Swords size={16} /> Rules
          </h3>
          <RulePills rules={game.rules} />
        </section>
        <section>
          <h3 className="mb-2 flex items-center gap-2 font-display font-semibold">
            <ScrollText size={16} /> Match log
          </h3>
          <MatchLog game={game} />
        </section>
      </div>
    </Overlay>
  );
}
