"use client";

import clsx from "clsx";
import { BookOpen, Coins, Copy, Crown, Lock, RefreshCcw, ScrollText, Swords, Users, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { GameBoard, lastMoveAnimationSettleMs } from "@/components/game/board";
import { Hand } from "@/components/game/hand";
import { MatchLog } from "@/components/game/match-log";
import { OutcomeOverlay } from "@/components/game/outcome-overlay";
import { RulePills } from "@/components/game/rule-pills";
import { ScoreBar } from "@/components/game/score-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/panel";
import { Input } from "@/components/ui/input";
import { Overlay } from "@/components/ui/overlay";
import { PVE_OPPONENTS } from "@/game/content";
import type { GameState, PlayerSlot } from "@/game/types";
import { OPENING_FLIP_MS, OPENING_FLIP_SPIN_MS, useTessera } from "@/lib/client/store";

type Mode = "pve" | "pvp";

export function PlayScreen() {
  const store = useTessera();
  const [mode, setMode] = useState<Mode>("pve");
  const [infoOpen, setInfoOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(true);
  const [openingFlipVisible, setOpeningFlipVisible] = useState(false);
  const [outcomeVisible, setOutcomeVisible] = useState(false);

  const usingPvp = mode === "pvp" && store.pvpState;
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
  const onCell = mode === "pvp" ? store.playPvp : store.playLocal;
  const reward = store.lastPveReward?.amount;

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
          reward={mode === "pve" ? reward : undefined}
          onPlayAgain={() => {
            if (mode === "pve") {
              void store.resetLocalGame();
            } else {
              setSetupOpen(true);
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
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {/* control bar */}
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="flex rounded-md border border-line bg-surface p-1">
          {(["pve", "pvp"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={clsx(
                "rounded-sm px-4 py-1.5 text-sm font-semibold transition-colors",
                mode === value ? "row-select text-content" : "text-content-muted hover:text-content"
              )}
            >
              {value === "pve" ? "PvE" : "PvP"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setSetupOpen(true)}>
            {mode === "pve" ? <Users size={16} /> : <Wifi size={16} />}
            <span className="hidden sm:inline">{mode === "pve" ? "Opponents" : "Rooms"}</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setInfoOpen(true)}>
            <BookOpen size={16} />
            <span className="hidden sm:inline">Match</span>
          </Button>
          {mode === "pve" && (
            <Button size="sm" variant="ghost" onClick={() => void store.resetLocalGame()}>
              <RefreshCcw size={16} />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* score sits directly above the board */}
      <div className="mx-auto w-full max-w-md shrink-0">
        <ScoreBar game={game} youSlot={youSlot} />
      </div>

      {/* desktop: hands flank the board */}
      <div
        className="hidden min-h-0 flex-1 items-center justify-center gap-4 lg:flex xl:gap-8"
        style={
          {
            "--card-w": "min(15dvh, 12vw)",
            // board is 3 card-tall rows plus gaps/padding; hands span the same height
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
        {board}
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
      </div>

      {/* mobile: opponent hand on top, your hand on the bottom */}
      <div
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 lg:hidden"
        style={
          {
            "--card-w": "min(23vw, calc((76dvh - 7rem) / 8))",
            // horizontal hands span the board width: 3 cards plus gaps/padding
            "--hand-span": "calc(var(--card-w) * 3 + 2rem)"
          } as React.CSSProperties
        }
      >
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

      <MatchInfoOverlay open={infoOpen} onClose={() => setInfoOpen(false)} game={game} />
      <Overlay
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        title={mode === "pve" ? "Choose an opponent" : "PvP duel"}
      >
        {mode === "pve" ? (
          <OpponentPicker onPicked={() => setSetupOpen(false)} />
        ) : (
          <PvpLobby />
        )}
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

function OpponentPicker({ onPicked }: { onPicked: () => void }) {
  const { opponentId, resetLocalGame, isOpponentUnlocked, pveProgress } = useTessera();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PVE_OPPONENTS.map((opponent) => {
        const active = opponent.id === opponentId;
        const unlocked = isOpponentUnlocked(opponent.id);
        const progress = pveProgress.find((entry) => entry.opponentId === opponent.id);
        return (
          <button
            key={opponent.id}
            disabled={!unlocked}
            onClick={() => {
              void resetLocalGame(opponent.id);
              onPicked();
            }}
            className={clsx(
              "rounded-md border p-4 text-left transition-colors",
              active && unlocked
                ? "border-accent bg-accent/10"
                : "border-line bg-surface-2 hover:border-line-strong",
              !unlocked && "cursor-not-allowed opacity-55 hover:border-line"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-semibold">{opponent.name}</h3>
              {unlocked ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-gold">
                  <Crown size={14} /> {opponent.rewardCurrency}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-content-faint">
                  <Lock size={14} /> Locked
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm text-content-muted">{opponent.tutorialCopy}</p>
            {progress && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-content-faint">
                {progress.completedAt ? `${progress.wins} win${progress.wins === 1 ? "" : "s"}` : "Attempted"} · Best{" "}
                {progress.bestScore ?? 0}
              </p>
            )}
            <div className="mt-3">
              <RulePills rules={opponent.ruleSet} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PvpLobby() {
  const { roomId, joinCode, setJoinCode, pvpSlot, createPvpRoom, joinPvpRoom, notify } = useTessera();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-content-muted">Play a live match over an invite code.</p>
        <Badge className="border-line-strong text-content-muted">{pvpSlot ? `Seat ${pvpSlot}` : "Idle"}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="accent" onClick={createPvpRoom}>
          <Wifi size={17} /> Create room
        </Button>
        <div className="flex gap-2">
          <Input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            placeholder="ROOM CODE"
            className="uppercase"
          />
          <Button onClick={joinPvpRoom}>Join</Button>
        </div>
      </div>
      {roomId && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-gold/40 bg-gold/10 px-3 py-2.5">
          <div>
            <p className="text-xs uppercase tracking-wide text-content-muted">Room code</p>
            <p className="font-display text-lg font-bold tracking-widest text-gold">{roomId}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              void navigator.clipboard?.writeText(roomId);
              notify("Room code copied.", "success");
            }}
          >
            <Copy size={15} /> Copy
          </Button>
        </div>
      )}
    </div>
  );
}
