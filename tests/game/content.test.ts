import { describe, expect, it } from "vitest";
import { chooseWeightedAiDeckTemplateIds, getCardTemplate } from "../../src/game/content";

describe("content deck generation", () => {
  it("builds deterministic weighted AI decks from common, uncommon, and rare cards", () => {
    const first = chooseWeightedAiDeckTemplateIds("match-seed", 2);
    const second = chooseWeightedAiDeckTemplateIds("match-seed", 2);

    expect(first).toHaveLength(5);
    expect(new Set(first).size).toBe(5);
    expect(second).toEqual(first);
    expect(first.every((id) => ["COMMON", "UNCOMMON", "RARE"].includes(getCardTemplate(id).rarity))).toBe(
      true
    );
  });
});
