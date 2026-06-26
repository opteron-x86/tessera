import { describe, expect, it } from "vitest";
import { chooseAiMove } from "../../src/game/ai";
import { chooseFirstPlayer, createGame, playCard, validateDeck } from "../../src/game/engine";
import type { CardInstance, CardTemplate, Deck, GameState, RuleSet, Sides } from "../../src/game/types";

const baseRules: RuleSet = {
  open: true,
  same: false,
  plus: false,
  combo: false
};

describe("Tessera engine", () => {
  it("chooses the first player deterministically from the match seed", () => {
    expect(chooseFirstPlayer("test")).toBe("one");
    expect(chooseFirstPlayer("local-old-road-tutor")).toBe("two");
  });

  it("requires exactly five unique owned cards per deck", () => {
    const deck = deckWith("one", [
      sides(1, 1, 1, 1),
      sides(2, 2, 2, 2),
      sides(3, 3, 3, 3)
    ]);

    expect(validateDeck(deck)).toContain("A Tessera deck must contain exactly 5 cards.");
  });

  it("captures adjacent cards with stronger sides", () => {
    const one = deckWith("one", [sides(7, 1, 1, 1)]);
    const two = deckWith("two", [sides(1, 1, 3, 1)]);
    const state = preparedState(one, two);
    state.board[1] = { index: 1, owner: "two", card: two.cards[0]! };

    const result = playCard(state, {
      type: "PLAY_CARD",
      player: "one",
      cardId: one.cards[0]!.id,
      position: 4
    });

    expect(result.board[1]?.owner).toBe("one");
    expect(result.events.some((event) => event.type === "CARDS_CAPTURED")).toBe(true);
  });

  it("applies Legion immediately when the third matching affinity enters the board", () => {
    const one = deckWith("one", [
      namedCard("beast-striker", sides(4, 1, 1, 1), "Beast"),
      namedCard("beast-anchor", sides(1, 1, 1, 1), "Beast")
    ]);
    const two = deckWith("two", [
      namedCard("human-guard", sides(1, 1, 4, 1), "Human"),
      namedCard("beast-lookout", sides(1, 1, 1, 1), "Beast")
    ]);
    const state = preparedState(one, two, { ...baseRules, legion: true });
    state.board[0] = { index: 0, owner: "one", card: one.cards[1]! };
    state.board[1] = { index: 1, owner: "two", card: two.cards[0]! };
    state.board[8] = { index: 8, owner: "two", card: two.cards[1]! };

    const result = playCard(state, {
      type: "PLAY_CARD",
      player: "one",
      cardId: one.cards[0]!.id,
      position: 4
    });

    expect(result.board[1]?.owner).toBe("one");
  });

  it("applies Decimation immediately when the third matching affinity enters the board", () => {
    const one = deckWith("one", [
      namedCard("beast-striker", sides(5, 1, 1, 1), "Beast"),
      namedCard("beast-anchor", sides(1, 1, 1, 1), "Beast")
    ]);
    const two = deckWith("two", [
      namedCard("human-guard", sides(1, 1, 4, 1), "Human"),
      namedCard("beast-lookout", sides(1, 1, 1, 1), "Beast")
    ]);
    const state = preparedState(one, two, { ...baseRules, decimation: true });
    state.board[0] = { index: 0, owner: "one", card: one.cards[1]! };
    state.board[1] = { index: 1, owner: "two", card: two.cards[0]! };
    state.board[8] = { index: 8, owner: "two", card: two.cards[1]! };

    const result = playCard(state, {
      type: "PLAY_CARD",
      player: "one",
      cardId: one.cards[0]!.id,
      position: 4
    });

    expect(result.board[1]?.owner).toBe("two");
    expect(result.events.some((event) => event.type === "CARDS_CAPTURED")).toBe(false);
  });

  it("resolves Same captures against two matching sides", () => {
    const one = deckWith("one", [sides(4, 9, 9, 2)]);
    const two = deckWith("two", [sides(1, 1, 4, 1), sides(1, 2, 1, 1)]);
    const state = preparedState(one, two, { ...baseRules, same: true });
    state.board[1] = { index: 1, owner: "two", card: two.cards[0]! };
    state.board[3] = { index: 3, owner: "two", card: two.cards[1]! };

    const result = playCard(state, {
      type: "PLAY_CARD",
      player: "one",
      cardId: one.cards[0]!.id,
      position: 4
    });

    expect(result.board[1]?.owner).toBe("one");
    expect(result.board[3]?.owner).toBe("one");
    expect(result.events.some((event) => event.type === "CARDS_CAPTURED" && event.reason === "same")).toBe(true);
  });

  it("does not trigger Same from a friendly and enemy pair", () => {
    const one = deckWith("one", [sides(4, 9, 9, 2), sides(1, 2, 1, 1)]);
    const two = deckWith("two", [sides(1, 1, 4, 1)]);
    const state = preparedState(one, two, { ...baseRules, same: true });
    state.board[1] = { index: 1, owner: "two", card: two.cards[0]! };
    state.board[3] = { index: 3, owner: "one", card: one.cards[1]! };

    const result = playCard(state, {
      type: "PLAY_CARD",
      player: "one",
      cardId: one.cards[0]!.id,
      position: 4
    });

    expect(result.board[1]?.owner).toBe("two");
    expect(result.board[3]?.owner).toBe("one");
    expect(
      result.events.some((event) => event.type === "CARDS_CAPTURED" && event.reason === "same")
    ).toBe(false);
  });

  it("resolves Plus captures when two sums match", () => {
    const one = deckWith("one", [sides(3, 9, 9, 4)]);
    const two = deckWith("two", [sides(1, 1, 7, 1), sides(1, 6, 1, 1)]);
    const state = preparedState(one, two, { ...baseRules, plus: true });
    state.board[1] = { index: 1, owner: "two", card: two.cards[0]! };
    state.board[3] = { index: 3, owner: "two", card: two.cards[1]! };

    const result = playCard(state, {
      type: "PLAY_CARD",
      player: "one",
      cardId: one.cards[0]!.id,
      position: 4
    });

    expect(result.board[1]?.owner).toBe("one");
    expect(result.board[3]?.owner).toBe("one");
    expect(result.events.some((event) => event.type === "CARDS_CAPTURED" && event.reason === "plus")).toBe(true);
  });

  it("does not trigger Plus from a friendly and enemy pair", () => {
    const one = deckWith("one", [sides(3, 9, 9, 4), sides(1, 6, 1, 1)]);
    const two = deckWith("two", [sides(1, 1, 7, 1)]);
    const state = preparedState(one, two, { ...baseRules, plus: true });
    state.board[1] = { index: 1, owner: "two", card: two.cards[0]! };
    state.board[3] = { index: 3, owner: "one", card: one.cards[1]! };

    const result = playCard(state, {
      type: "PLAY_CARD",
      player: "one",
      cardId: one.cards[0]!.id,
      position: 4
    });

    expect(result.board[1]?.owner).toBe("two");
    expect(result.board[3]?.owner).toBe("one");
    expect(
      result.events.some((event) => event.type === "CARDS_CAPTURED" && event.reason === "plus")
    ).toBe(false);
  });


  it("does not trigger Plus from the Tidecaller total-10 friendly/enemy pair", () => {
    const one = deckWith("one", [
      namedCard("myrathi-tidecaller", sides(1, 4, 5, 3)),
      namedCard("king-garath", sides(8, 7, 4, 8))
    ]);
    const two = deckWith("two", [namedCard("myrathi-raider", sides(5, 1, 3, 4))]);
    const state = preparedState(one, two, { ...baseRules, plus: true, combo: true });
    state.board[4] = { index: 4, owner: "one", card: one.cards[1]! };
    state.board[8] = { index: 8, owner: "two", card: two.cards[0]! };

    const result = playCard(state, {
      type: "PLAY_CARD",
      player: "one",
      cardId: one.cards[0]!.id,
      position: 5
    });

    expect(result.board[4]?.owner).toBe("one");
    expect(result.board[8]?.owner).toBe("two");
    expect(result.events.some((event) => event.type === "CARDS_CAPTURED")).toBe(false);
  });

  it("does not chain Combo from the Kynathi Highborn normal-only Tidecaller capture", () => {
    const one = deckWith("one", [
      namedCard("myrathi-tidecaller", sides(1, 4, 5, 3)),
      namedCard("myrathi-raider-a", sides(5, 1, 3, 4)),
      namedCard("myrathi-raider-b", sides(5, 1, 3, 4))
    ]);
    const two = deckWith("two", [
      namedCard("kynathi-highborn", sides(4, 3, 2, 5)),
      namedCard("ember-page", sides(2, 5, 4, 1))
    ]);
    const state = preparedState(one, two, {
      open: true,
      same: true,
      plus: true,
      combo: true
    });
    state.currentPlayer = "two";
    state.board[1] = { index: 1, owner: "two", card: two.cards[1]! };
    state.board[5] = { index: 5, owner: "one", card: one.cards[0]! };
    state.board[7] = { index: 7, owner: "one", card: one.cards[1]! };
    state.board[8] = { index: 8, owner: "one", card: one.cards[2]! };

    const result = playCard(state, {
      type: "PLAY_CARD",
      player: "two",
      cardId: two.cards[0]!.id,
      position: 2
    });

    expect(result.board[5]?.owner).toBe("two");
    expect(result.board[7]?.owner).toBe("one");
    expect(result.board[8]?.owner).toBe("one");
    expect(
      result.events.filter((event) => event.type === "CARDS_CAPTURED")
    ).toEqual([
      expect.objectContaining({
        positions: [5],
        reason: "normal"
      })
    ]);
  });

  it("chains Combo from Same and Plus captures", () => {
    const one = deckWith("one", [sides(4, 9, 9, 2)]);
    const two = deckWith("two", [
      sides(1, 8, 4, 8),
      sides(1, 2, 1, 1),
      sides(1, 1, 1, 1)
    ]);
    const state = preparedState(one, two, {
      open: true,
      same: true,
      plus: false,
      combo: true
    });
    state.board[1] = { index: 1, owner: "two", card: two.cards[0]! };
    state.board[3] = { index: 3, owner: "two", card: two.cards[1]! };
    state.board[0] = { index: 0, owner: "two", card: two.cards[2]! };

    const result = playCard(state, {
      type: "PLAY_CARD",
      player: "one",
      cardId: one.cards[0]!.id,
      position: 4
    });

    expect(result.board[0]?.owner).toBe("one");
    expect(result.events.some((event) => event.type === "CARDS_CAPTURED" && event.reason === "combo")).toBe(true);
  });

  it("does not chain Combo when the Combo rule is disabled", () => {
    const one = deckWith("one", [sides(4, 9, 9, 2)]);
    const two = deckWith("two", [
      sides(1, 8, 4, 8),
      sides(1, 2, 1, 1),
      sides(1, 1, 1, 1)
    ]);
    const state = preparedState(one, two, {
      open: true,
      same: true,
      plus: false,
      combo: false
    });
    state.board[1] = { index: 1, owner: "two", card: two.cards[0]! };
    state.board[3] = { index: 3, owner: "two", card: two.cards[1]! };
    state.board[0] = { index: 0, owner: "two", card: two.cards[2]! };

    const result = playCard(state, {
      type: "PLAY_CARD",
      player: "one",
      cardId: one.cards[0]!.id,
      position: 4
    });

    expect(result.board[0]?.owner).toBe("two");
    expect(result.events.some((event) => event.type === "CARDS_CAPTURED" && event.reason === "combo")).toBe(false);
  });

  it("standard AI uses Same opportunities when they are available", () => {
    const one = deckWith("one", [sides(1, 1, 1, 1)]);
    const two = deckWith("two", [sides(1, 9, 9, 2), sides(1, 1, 1, 1)]);
    const state = preparedState(one, two, { ...baseRules, same: true });
    state.currentPlayer = "two";
    state.board[1] = { index: 1, owner: "one", card: one.cards[0]! };
    state.board[3] = { index: 3, owner: "one", card: card("one", 10, sides(1, 2, 1, 1)) };

    const result = playCard(state, chooseAiMove(state, { tier: "standard" }));

    expect(result.events.some((event) => event.type === "CARDS_CAPTURED" && event.reason === "same")).toBe(true);
  });

  it("expert AI looks ahead to avoid an immediate losing reply", () => {
    const one = deckWith("one", [sides(9, 1, 1, 9)]);
    const two = deckWith("two", [sides(1, 9, 9, 1), sides(5, 5, 5, 5)]);
    const state = preparedState(one, two, { ...baseRules, open: true });
    state.currentPlayer = "two";
    state.board[0] = { index: 0, owner: "one", card: one.cards[0]! };

    const move = chooseAiMove(state, { tier: "expert" });
    const projected = playCard(state, move);
    const playerReply = chooseAiMove(projected, { tier: "expert" });

    expect(projected.board[0]?.owner).toBe("two");
    expect(playerReply.position).not.toBe(1);
  });

  it("standard AI avoids wasting a premium card in a vulnerable corner early", () => {
    const one = deckWith("one", [sides(5, 1, 1, 1), sides(1, 1, 1, 1)]);
    const two = deckWith("two", [sides(8, 7, 4, 8), sides(2, 5, 4, 1), sides(4, 3, 2, 5)]);
    const state = preparedState(one, two, { ...baseRules, open: true });
    state.currentPlayer = "two";
    state.board[1] = { index: 1, owner: "one", card: one.cards[1]! };

    const move = chooseAiMove(state, { tier: "standard" });

    expect(move).not.toMatchObject({
      cardId: two.cards[0]!.id,
      position: 2
    });
  });

  it("rejects moves out of turn", () => {
    const one = deckWith("one", [sides(1, 1, 1, 1)]);
    const two = deckWith("two", [sides(1, 1, 1, 1)]);
    const state = preparedState(one, two);

    expect(() =>
      playCard(state, {
        type: "PLAY_CARD",
        player: "two",
        cardId: two.cards[0]!.id,
        position: 0
      })
    ).toThrow("It is not this player's turn.");
  });
});

function preparedState(one: Deck, two: Deck, rules: RuleSet = baseRules): GameState {
  const state = createGame({
    id: "test",
    seed: "test",
    rules,
    playerOneDeck: fullDeck(one),
    playerTwoDeck: fullDeck(two)
  });
  state.hands.one = one.cards;
  state.hands.two = two.cards;
  state.scores = {
    one: state.hands.one.length,
    two: state.hands.two.length
  };
  return state;
}

function fullDeck(deck: Deck): Deck {
  const cards = [...deck.cards];
  while (cards.length < 5) {
    cards.push(card(deck.ownerId, cards.length, sides(1, 1, 1, 1)));
  }

  return {
    ...deck,
    cards
  };
}

function deckWith(ownerId: string, values: Sides[] | CardInstance[]): Deck {
  return {
    id: `${ownerId}-deck`,
    ownerId,
    name: `${ownerId} deck`,
    cards: values.map((value, index) =>
      "template" in value ? { ...value, ownerId } : card(ownerId, index, value)
    )
  };
}

function card(ownerId: string, index: number, value: Sides): CardInstance {
  return {
    id: `${ownerId}-${index}`,
    ownerId,
    upgradeLevel: 0,
    template: template(`${ownerId}-${index}`, value)
  };
}

function namedCard(id: string, value: Sides, affinity?: string): CardInstance {
  return {
    id,
    ownerId: "test",
    upgradeLevel: 0,
    template: template(id, value, affinity)
  };
}

function template(id: string, value: Sides, affinity?: string): CardTemplate {
  return {
    id,
    name: id,
    series: "test",
    rarity: "COMMON",
    tier: 1,
    affinity,
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
