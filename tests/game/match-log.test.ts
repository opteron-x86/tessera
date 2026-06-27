import { describe, expect, it } from "vitest";
import { describeMatchEvent } from "../../src/components/game/match-log";
import type { CardInstance, CardTemplate, GameState, Sides } from "../../src/game/types";

describe("match log copy", () => {
  it("names placed cards", () => {
    const game = gameWithCards({
      board: [cell(0, "one", card("one-squonk", "Squonk"))],
      hands: {
        one: [],
        two: []
      }
    });

    expect(
      describeMatchEvent(game, {
        type: "CARD_PLACED",
        player: "one",
        cardId: "one-squonk",
        position: 0,
        moveNumber: 1
      })
    ).toBe("You placed Squonk on tile 1.");
  });

  it("names captured cards", () => {
    const game = gameWithCards({
      board: [
        cell(0, "one", card("one-squonk", "Squonk")),
        cell(1, "two", card("two-ghoul", "Ghoul"))
      ],
      hands: {
        one: [],
        two: []
      }
    });

    expect(
      describeMatchEvent(game, {
        type: "CARDS_CAPTURED",
        player: "one",
        positions: [0, 1],
        reason: "plus",
        moveNumber: 4
      })
    ).toBe("You captured Squonk and Ghoul (Plus).");
  });
});

function gameWithCards(args: {
  board: NonNullable<GameState["board"][number]>[];
  hands: Pick<GameState["hands"], "one" | "two">;
}): GameState {
  const board = Array.from({ length: 9 }, () => null) as GameState["board"];
  for (const entry of args.board) {
    board[entry.index] = entry;
  }

  return {
    id: "log-test",
    seed: "log-test",
    phase: "active",
    rules: {
      open: true,
      same: false,
      plus: false,
      combo: false
    },
    board,
    hands: args.hands,
    currentPlayer: "one",
    scores: {
      one: 5,
      two: 5
    },
    winner: null,
    moveNumber: 0,
    events: []
  };
}

function cell(index: number, owner: "one" | "two", entry: CardInstance) {
  return {
    index,
    owner,
    card: entry
  };
}

function card(id: string, name: string): CardInstance {
  return {
    id,
    ownerId: id.startsWith("one") ? "one" : "two",
    upgradeLevel: 0,
    template: template(id, name, sides(1, 1, 1, 1))
  };
}

function template(id: string, name: string, value: Sides): CardTemplate {
  return {
    id,
    name,
    series: "test",
    rarity: "COMMON",
    tier: 1,
    sides: value,
    lore: "",
    palette: {
      primary: "#66717a",
      secondary: "#d1c5ad",
      ink: "#151617"
    }
  };
}

function sides(top: number, right: number, bottom: number, left: number): Sides {
  return { top, right, bottom, left };
}
