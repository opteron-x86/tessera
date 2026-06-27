"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { io, type Socket } from "socket.io-client";
import { chooseAiMove } from "@/game/ai";
import {
  CORE_RULES,
  PVE_OPPONENTS,
  STARTER_CARD_IDS,
  makeDeck,
  makeWeightedAiDeck
} from "@/game/content";
import { applyCommand, createGame } from "@/game/engine";
import type { CardInstance, CardTemplate, GameState, MatchEvent, PlayerSlot } from "@/game/types";
import {
  fetchSnapshot,
  openBooster,
  playPveAiMove,
  playPveMove,
  saveDeck,
  startPveMatch,
  transmuteCard,
  type PveReward,
  type SnapshotCard,
  type SocketAck
} from "./api";
import { toCardInstance } from "./cards";

export type ToastTone = "info" | "success" | "danger";
export type Toast = { id: number; message: string; tone: ToastTone };

type Store = ReturnType<typeof useStoreValue>;

export const AI_MOVE_DELAY_MS = 650;
const AI_CAPTURE_DELAY_MS = 900;
const AI_SPECIAL_CAPTURE_DELAY_MS = 1380;
const AI_COMBO_CAPTURE_DELAY_MS = 2050;
export const OPENING_FLIP_SPIN_MS = 900;
export const OPENING_FLIP_REVEAL_MS = 700;
export const OPENING_FLIP_MS = OPENING_FLIP_SPIN_MS + OPENING_FLIP_REVEAL_MS;
const OPENING_AI_DELAY_MS = OPENING_FLIP_MS + AI_MOVE_DELAY_MS;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function aiResponseDelay(state: GameState) {
  const latestCaptures = state.events.filter(
    (event): event is Extract<MatchEvent, { type: "CARDS_CAPTURED" }> =>
      event.moveNumber === state.moveNumber && event.type === "CARDS_CAPTURED"
  );

  if (latestCaptures.some((event) => event.reason === "combo")) {
    return AI_COMBO_CAPTURE_DELAY_MS;
  }

  if (latestCaptures.some((event) => event.reason === "same" || event.reason === "plus")) {
    return AI_SPECIAL_CAPTURE_DELAY_MS;
  }

  if (latestCaptures.length > 0) {
    return AI_CAPTURE_DELAY_MS;
  }

  return AI_MOVE_DELAY_MS;
}

const TesseraContext = createContext<Store | null>(null);

function emitWithAck(socket: Socket, event: string, payload: unknown): Promise<SocketAck> {
  return new Promise((resolve) => {
    socket.emit(event, payload, (response: SocketAck) => resolve(response));
  });
}

function useStoreValue() {
  const { data: session, status } = useSession();

  // Auth form
  const [loginEmail, setLoginEmail] = useState("player@tessera.local");
  const [loginName, setLoginName] = useState("Wayfarer");

  // Data
  const [snapshot, setSnapshot] = useState<import("./api").Snapshot | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);
  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const notify = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = ++toastSeq.current;
      setToasts((current) => [...current, { id, message, tone }]);
      setTimeout(() => dismissToast(id), 4200);
    },
    [dismissToast]
  );

  // Selection shared by duel / deck builder
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedDeckCards, setSelectedDeckCards] = useState<string[]>([]);
  const [openedCards, setOpenedCards] = useState<CardTemplate[]>([]);

  // Duel mode — which surface launched the active duel (drives the /play/duel screen)
  const [duelMode, setDuelMode] = useState<"pve" | "pvp">("pve");

  // PvE / local duel
  const [opponentId, setOpponentId] = useState(PVE_OPPONENTS[0]!.id);
  const [pveMatchId, setPveMatchId] = useState<string | null>(null);
  const [lastPveReward, setLastPveReward] = useState<PveReward | null>(null);
  const aiTurnSeq = useRef(0);
  const localOneDeck = useMemo(
    () => makeDeck("local-one", "local-player", "First Road", STARTER_CARD_IDS),
    []
  );
  const [game, setGame] = useState<GameState>(() =>
    ({
      ...createGame({
        id: "local-demo",
        seed: "local-demo",
        rules: CORE_RULES,
        playerOneDeck: localOneDeck,
        playerTwoDeck: makeWeightedAiDeck(
          "local-two",
          "local-opponent",
        "Tutor",
        "local-demo",
        PVE_OPPONENTS[0]!.difficulty,
        PVE_OPPONENTS[0]!.deckAffinity
        )
      }),
      phase: "lobby"
    })
  );

  // PvP
  const [roomId, setRoomId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [pvpSlot, setPvpSlot] = useState<PlayerSlot | null>(null);
  const [pvpState, setPvpState] = useState<GameState | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const ownedCardsRaw: SnapshotCard[] = snapshot?.cards ?? localOneDeck.cards;
  const ownedCards = useMemo(() => ownedCardsRaw.map(toCardInstance), [ownedCardsRaw]);
  const activeDeckCards: CardInstance[] = useMemo(
    () => snapshot?.decks[0]?.cards.map((slot) => toCardInstance(slot.card)) ?? localOneDeck.cards,
    [snapshot, localOneDeck]
  );
  const playerCurrency = snapshot?.profile.currency ?? 500;
  const deckSlots = snapshot?.profile.deckSlots ?? 3;
  const pveProgress = useMemo(() => snapshot?.pveProgress ?? [], [snapshot]);
  const isOpponentUnlocked = useCallback(
    (targetOpponentId: string) => {
      const opponent =
        PVE_OPPONENTS.find((candidate) => candidate.id === targetOpponentId) ?? PVE_OPPONENTS[0]!;
      if (!opponent.unlockAfterId) {
        return true;
      }

      return pveProgress.some(
        (progress) =>
          progress.opponentId === opponent.unlockAfterId && Boolean(progress.completedAt)
      );
    },
    [pveProgress]
  );

  const refreshSnapshot = useCallback(async () => {
    setSnapshotLoading(true);
    try {
      setSnapshot(await fetchSnapshot());
    } catch (error) {
      notify(error instanceof Error ? error.message : "API unavailable.", "danger");
    } finally {
      setSnapshotLoading(false);
    }
  }, [notify]);

  const applyPveReward = useCallback(
    (reward: PveReward | null, nextSnapshot: import("./api").Snapshot | null) => {
      if (!reward) {
        return;
      }

      setLastPveReward(reward);
      if (nextSnapshot) {
        setSnapshot(nextSnapshot);
      }
      notify(`+${reward.amount} currency earned.`, "success");
    },
    [notify]
  );

  useEffect(() => {
    if (status === "authenticated") {
      void refreshSnapshot();
    }
  }, [status, refreshSnapshot]);

  useEffect(() => {
    if (snapshot?.decks[0]) {
      setSelectedDeckCards(snapshot.decks[0].cards.map((slot) => slot.card.id));
    }
  }, [snapshot]);

  const resetLocalGame = useCallback(
    async (nextOpponentId = opponentId) => {
      const setupSeq = ++aiTurnSeq.current;
      const opponent =
        PVE_OPPONENTS.find((candidate) => candidate.id === nextOpponentId) ?? PVE_OPPONENTS[0]!;
      setSelectedCardId(null);
      setOpponentId(opponent.id);
      setLastPveReward(null);

      if (status === "authenticated") {
        try {
          const next = await startPveMatch(opponent.id);
          if (setupSeq !== aiTurnSeq.current) {
            return;
          }

          setPveMatchId(next.matchId);
          setGame(next.game);
          notify(`${next.opponent.name} awaits.`, "success");
          if (next.game.phase === "active" && next.game.currentPlayer === "two") {
            await delay(OPENING_AI_DELAY_MS);
            if (setupSeq !== aiTurnSeq.current) {
              return;
            }
            const ai = await playPveAiMove(next.matchId);
            if (setupSeq !== aiTurnSeq.current) {
              return;
            }
            setGame(ai.game);
            applyPveReward(ai.reward, ai.snapshot);
          }
        } catch (error) {
          notify(error instanceof Error ? error.message : "PvE match start failed.", "danger");
        }
        return;
      }

      setPveMatchId(null);
      const nextGameId = `local-${opponent.id}-${Date.now()}`;
      const nextGame = createGame({
        id: nextGameId,
        seed: `local-${opponent.id}`,
        rules: opponent.ruleSet,
        playerOneDeck: {
          id: "active-local",
          ownerId: "local-player",
          name: "Active Deck",
          cards: activeDeckCards
        },
        playerTwoDeck: makeWeightedAiDeck(
          `${opponent.id}-deck`,
          "local-opponent",
          opponent.name,
          nextGameId,
          opponent.difficulty,
          opponent.deckAffinity
        )
      });
      setGame(nextGame);

      if (nextGame.phase === "active" && nextGame.currentPlayer === "two") {
        await delay(OPENING_AI_DELAY_MS);
        if (setupSeq !== aiTurnSeq.current) {
          return;
        }
        setGame(applyCommand(nextGame, chooseAiMove(nextGame, { tier: opponent.aiTier })));
      }
    },
    [opponentId, activeDeckCards, status, notify, applyPveReward]
  );

  const playLocal = useCallback(
    async (position: number) => {
      if (!selectedCardId || game.currentPlayer !== "one" || game.phase !== "active") {
        return;
      }

      const command = {
        type: "PLAY_CARD" as const,
        player: "one" as const,
        cardId: selectedCardId,
        position
      };
      const turnSeq = ++aiTurnSeq.current;

      if (status === "authenticated" && pveMatchId) {
        try {
          const playerMove = applyCommand(game, command);
          setSelectedCardId(null);
          setGame(playerMove);

          const next = await playPveMove({
            matchId: pveMatchId,
            cardId: selectedCardId,
            position
          });
          if (playerMove.phase === "active") {
            await delay(aiResponseDelay(playerMove));
          }
          if (turnSeq !== aiTurnSeq.current) {
            return;
          }
          setGame(next.game);
          applyPveReward(next.reward, next.snapshot);
        } catch (error) {
          if (turnSeq === aiTurnSeq.current) {
            setGame(game);
          }
          notify(error instanceof Error ? error.message : "PvE move failed.", "danger");
        }
        return;
      }

      try {
        const playerMove = applyCommand(game, command);
        setSelectedCardId(null);
        setGame(playerMove);
        if (playerMove.phase === "active") {
          const opponent =
            PVE_OPPONENTS.find((candidate) => candidate.id === opponentId) ?? PVE_OPPONENTS[0]!;
          const aiMove = chooseAiMove(playerMove, { tier: opponent.aiTier });
          await delay(aiResponseDelay(playerMove));
          if (turnSeq !== aiTurnSeq.current) {
            return;
          }
          setGame(applyCommand(playerMove, aiMove));
        }
      } catch (error) {
        notify(error instanceof Error ? error.message : "Illegal move.", "danger");
      }
    },
    [selectedCardId, game, status, pveMatchId, opponentId, notify, applyPveReward]
  );

  const toggleDeckCard = useCallback((cardId: string) => {
    setSelectedDeckCards((current) =>
      current.includes(cardId)
        ? current.filter((id) => id !== cardId)
        : current.length < 5
          ? [...current, cardId]
          : current
    );
  }, []);

  const saveCurrentDeck = useCallback(async () => {
    if (selectedDeckCards.length !== 5) {
      notify("A deck needs exactly five cards.", "danger");
      return;
    }
    try {
      const next = await saveDeck({
        deckId: snapshot?.decks[0]?.id,
        name: snapshot?.decks[0]?.name ?? "First Road",
        cardIds: selectedDeckCards
      });
      setSnapshot(next);
      notify("Deck saved.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Deck save failed.", "danger");
    }
  }, [selectedDeckCards, snapshot, notify]);

  const openPack = useCallback(
    async (packId: string) => {
      try {
        const result = await openBooster(packId);
        setOpenedCards(result.opened.cards.map((card) => card.template));
        setSnapshot(result.snapshot);
        notify("Pack opened.", "success");
      } catch (error) {
        notify(error instanceof Error ? error.message : "Pack opening failed.", "danger");
      }
    },
    [notify]
  );

  const transmute = useCallback(
    async (cardId: string) => {
      try {
        const result = await transmuteCard(cardId);
        setSnapshot(result.snapshot);
        notify(`+${result.transmutation.amount} currency.`, "success");
      } catch (error) {
        notify(error instanceof Error ? error.message : "Transmutation failed.", "danger");
      }
    },
    [notify]
  );

  const handleLogin = useCallback(async () => {
    const result = await signIn("credentials", {
      email: loginEmail,
      name: loginName,
      redirect: false
    });
    if (result?.error) {
      notify(result.error, "danger");
    }
  }, [loginEmail, loginName, notify]);

  const logout = useCallback(() => signOut({ redirect: false }), []);

  const getSocket = useCallback(() => {
    if (!socketRef.current) {
      socketRef.current = io({ path: "/socket.io" });
      socketRef.current.on("pvp:room", (payload: { roomId: string; state: GameState | null }) => {
        setRoomId(payload.roomId);
        setPvpState(payload.state);
      });
    }
    return socketRef.current;
  }, []);

  const createPvpRoom = useCallback(async () => {
    const ack = await emitWithAck(getSocket(), "pvp:create", {
      userId: session?.user?.id ?? `local-${loginName}`,
      name: session?.user?.name ?? loginName
    });
    if (!ack.ok) {
      notify(ack.error ?? "Room creation failed.", "danger");
      return;
    }
    setRoomId(ack.roomId ?? "");
    setPvpSlot(ack.slot ?? "one");
    notify(`Room ${ack.roomId} created.`, "success");
  }, [getSocket, session, loginName, notify]);

  const joinPvpRoom = useCallback(async () => {
    const ack = await emitWithAck(getSocket(), "pvp:join", {
      roomId: joinCode,
      userId: session?.user?.id ?? `local-${loginName}`,
      name: session?.user?.name ?? loginName
    });
    if (!ack.ok) {
      notify(ack.error ?? "Join failed.", "danger");
      return;
    }
    setRoomId(ack.roomId ?? "");
    setPvpSlot(ack.slot ?? "two");
    setPvpState(ack.state ?? null);
  }, [getSocket, joinCode, session, loginName, notify]);

  const playPvp = useCallback(
    async (position: number) => {
      if (!pvpState || !pvpSlot || !selectedCardId || pvpState.currentPlayer !== pvpSlot) {
        return;
      }
      const ack = await emitWithAck(getSocket(), "pvp:play", {
        roomId,
        command: {
          type: "PLAY_CARD",
          player: pvpSlot,
          cardId: selectedCardId,
          position
        }
      });
      if (!ack.ok) {
        notify(ack.error ?? "Move rejected.", "danger");
        return;
      }
      setSelectedCardId(null);
      setPvpState(ack.state ?? null);
    },
    [pvpState, pvpSlot, selectedCardId, getSocket, roomId, notify]
  );

  return {
    status,
    session,
    loginEmail,
    setLoginEmail,
    loginName,
    setLoginName,
    handleLogin,
    logout,
    snapshot,
    snapshotLoading,
    refreshSnapshot,
    notify,
    toasts,
    dismissToast,
    ownedCards,
    activeDeckCards,
    playerCurrency,
    deckSlots,
    pveProgress,
    isOpponentUnlocked,
    selectedCardId,
    setSelectedCardId,
    selectedDeckCards,
    toggleDeckCard,
    saveCurrentDeck,
    openedCards,
    openPack,
    transmute,
    duelMode,
    setDuelMode,
    opponentId,
    pveMatchId,
    lastPveReward,
    game,
    resetLocalGame,
    playLocal,
    roomId,
    joinCode,
    setJoinCode,
    pvpSlot,
    pvpState,
    createPvpRoom,
    joinPvpRoom,
    playPvp
  };
}

export function TesseraStoreProvider({ children }: { children: React.ReactNode }) {
  const value = useStoreValue();
  return <TesseraContext.Provider value={value}>{children}</TesseraContext.Provider>;
}

export function useTessera() {
  const value = useContext(TesseraContext);
  if (!value) {
    throw new Error("useTessera must be used within TesseraStoreProvider.");
  }
  return value;
}
