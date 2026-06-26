import type { BOOSTER_PACKS, PVE_OPPONENTS } from "@/game/content";
import type { CardTemplate, GameState, PlayerSlot } from "@/game/types";

export type SnapshotCard = {
  id: string;
  ownerId: string;
  upgradeLevel: number;
  template: CardTemplate;
};

export type Snapshot = {
  profile: {
    currency: number;
    deckSlots: number;
  };
  cards: SnapshotCard[];
  decks: Array<{
    id: string;
    name: string;
    cards: Array<{ position: number; card: SnapshotCard }>;
  }>;
  pveProgress: Array<{
    userId: string;
    opponentId: string;
    wins: number;
    bestScore: number | null;
    completedAt: string | null;
  }>;
  packs: typeof BOOSTER_PACKS;
  opponents: typeof PVE_OPPONENTS;
};

export type PveReward = {
  amount: number;
  awarded: boolean;
  won: boolean;
  draw: boolean;
};

export type SocketAck = {
  ok: boolean;
  error?: string;
  roomId?: string;
  slot?: PlayerSlot;
  state?: import("@/game/types").GameState;
};

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error ?? `Request to ${input} failed.`);
  }
  return response.json() as Promise<T>;
}

function json(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

export function fetchSnapshot() {
  return request<Snapshot>("/api/bootstrap");
}

export function saveDeck(input: { deckId?: string; name: string; cardIds: string[] }) {
  return request<Snapshot>("/api/decks", json(input));
}

export function openBooster(packId: string) {
  return request<{ opened: { cards: Array<{ template: CardTemplate }> }; snapshot: Snapshot }>(
    "/api/shop/booster",
    json({ packId })
  );
}

export function transmuteCard(cardId: string) {
  return request<{ transmutation: { amount: number }; snapshot: Snapshot }>(
    "/api/cards/transmute",
    json({ cardId })
  );
}

export function startPveMatch(opponentId: string) {
  return request<{
    matchId: string;
    opponent: (typeof PVE_OPPONENTS)[number];
    game: GameState;
  }>("/api/pve/start", json({ opponentId }));
}

export function playPveAiMove(matchId: string) {
  return request<{
    game: GameState;
    reward: PveReward | null;
    snapshot: Snapshot | null;
  }>("/api/pve/ai", json({ matchId }));
}

export function playPveMove(input: { matchId: string; cardId: string; position: number }) {
  return request<{
    game: GameState;
    reward: PveReward | null;
    snapshot: Snapshot | null;
  }>("/api/pve/move", json(input));
}
