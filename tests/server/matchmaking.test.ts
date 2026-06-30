import { describe, expect, it } from "vitest";
import {
  ABSENCE_STRIKE_LIMIT,
  nextAbsenceStrike,
  pairQueue,
  pickAutoMove,
  type QueueEntry,
} from "../../src/server/matchmaking";
import { CORE_RULES, STARTER_CARD_IDS, makeDeck } from "../../src/game/content";
import { createGame, emptyPositions } from "../../src/game/engine";

function entry(id: string): QueueEntry {
  return { socketId: `socket-${id}`, userId: `user-${id}`, name: id };
}

describe("matchmaking", () => {
  it("pairs queued players FIFO", () => {
    const { pairs, rest } = pairQueue([
      entry("a"),
      entry("b"),
      entry("c"),
      entry("d"),
    ]);
    expect(pairs).toHaveLength(2);
    expect(pairs[0]!.map((p) => p.userId)).toEqual(["user-a", "user-b"]);
    expect(pairs[1]!.map((p) => p.userId)).toEqual(["user-c", "user-d"]);
    expect(rest).toHaveLength(0);
  });

  it("leaves an odd player waiting", () => {
    const { pairs, rest } = pairQueue([entry("a"), entry("b"), entry("c")]);
    expect(pairs).toHaveLength(1);
    expect(rest.map((p) => p.userId)).toEqual(["user-c"]);
  });

  it("returns nothing for fewer than two players", () => {
    expect(pairQueue([]).pairs).toHaveLength(0);
    expect(pairQueue([entry("a")]).pairs).toHaveLength(0);
  });

  it("picks a legal auto-move for the player on the clock", () => {
    const game = createGame({
      id: "auto",
      seed: "auto",
      rules: CORE_RULES,
      playerOneDeck: makeDeck("p1", "user-1", "One", STARTER_CARD_IDS),
      playerTwoDeck: makeDeck("p2", "user-2", "Two", STARTER_CARD_IDS),
    });

    const move = pickAutoMove(game);
    expect(move.type).toBe("PLAY_CARD");
    expect(move.player).toBe(game.currentPlayer);
    expect(emptyPositions(game)).toContain(move.position);
    expect(
      game.hands[game.currentPlayer].some((card) => card.id === move.cardId),
    ).toBe(true);
  });

  it("drops a seat on the second consecutive absence strike", () => {
    const first = nextAbsenceStrike(0);
    expect(first.strikes).toBe(1);
    expect(first.shouldDrop).toBe(false);
    expect(first.firstDrop).toBe(false);

    const second = nextAbsenceStrike(first.strikes);
    expect(second.strikes).toBe(ABSENCE_STRIKE_LIMIT);
    expect(second.shouldDrop).toBe(true);
    expect(second.firstDrop).toBe(true);
  });

  it("does not repeatedly report the first drop after the threshold is already met", () => {
    const next = nextAbsenceStrike(ABSENCE_STRIKE_LIMIT);
    expect(next.shouldDrop).toBe(true);
    expect(next.firstDrop).toBe(false);
  });
});
