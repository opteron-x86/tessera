import { describe, expect, it } from "vitest";
import { makeDeck, STARTER_CARD_IDS } from "../../src/game/content";
import { validateDeck } from "../../src/game/engine";

describe("deck contract", () => {
  it("accepts the seeded starter deck", () => {
    const deck = makeDeck("starter", "player", "Starter", STARTER_CARD_IDS);

    expect(validateDeck(deck)).toEqual([]);
  });

  it("rejects duplicate owned card ids", () => {
    const deck = makeDeck("starter", "player", "Starter", STARTER_CARD_IDS);
    deck.cards[1] = deck.cards[0]!;

    expect(validateDeck(deck)).toContain("A deck cannot contain the same owned card twice.");
  });
});
