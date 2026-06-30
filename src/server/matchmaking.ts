import { chooseAiMove } from "../game/ai";
import type { GameState, PlayCardCommand } from "../game/types";

/** Seconds a player has to act before the server auto-plays for them. */
export const TURN_MS = 30_000;

/** Grace period after a disconnect before it counts as an absence strike. */
export const DISCONNECT_GRACE_MS = 60_000;

/** Consecutive leaves, disconnects, or timeouts before a seat becomes AI-controlled. */
export const ABSENCE_STRIKE_LIMIT = 2;

/** Small delay for AI-controlled PvP turns so board animations can settle. */
export const AI_TAKEOVER_MOVE_MS = 900;

export type AbsenceReason = "left" | "disconnect" | "timeout";

export type QueueEntry = {
  socketId: string;
  userId: string;
  name: string;
};

export function nextAbsenceStrike(
  currentStrikes: number,
  limit = ABSENCE_STRIKE_LIMIT,
): { strikes: number; shouldDrop: boolean; firstDrop: boolean } {
  const strikes = currentStrikes + 1;
  return {
    strikes,
    shouldDrop: strikes >= limit,
    firstDrop: currentStrikes < limit && strikes >= limit,
  };
}

/**
 * Pair queued players FIFO. Returns the matched pairs and any leftover entry
 * (an odd one out keeps waiting). Pure so it can be unit-tested without sockets.
 */
export function pairQueue(queue: QueueEntry[]): {
  pairs: Array<[QueueEntry, QueueEntry]>;
  rest: QueueEntry[];
} {
  const pairs: Array<[QueueEntry, QueueEntry]> = [];
  let index = 0;
  for (; index + 1 < queue.length; index += 2) {
    pairs.push([queue[index]!, queue[index + 1]!]);
  }
  return { pairs, rest: queue.slice(index) };
}

/**
 * Choose a legal move for whoever is on the clock when their timer expires.
 * Uses the beginner AI so a timeout keeps the game progressing rather than
 * punishing a lag spike, and stays deterministic with the rest of the engine.
 */
export function pickAutoMove(state: GameState): PlayCardCommand {
  return chooseAiMove(state, { tier: "beginner" });
}
