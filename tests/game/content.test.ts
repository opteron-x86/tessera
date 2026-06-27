import { describe, expect, it } from "vitest";
import {
  PVE_OPPONENTS,
  chooseWeightedAiDeckTemplateIds,
  getCardTemplate,
  resolvePveOpponentRules
} from "../../src/game/content";

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

  it("resolves roulette opponents to deterministic concrete match rules", () => {
    const opponent = PVE_OPPONENTS.find((candidate) => candidate.id === "roulette-savant");
    expect(opponent).toBeDefined();

    const first = resolvePveOpponentRules(opponent!, "match-seed");
    const second = resolvePveOpponentRules(opponent!, "match-seed");

    expect(second).toEqual(first);
    expect(first.roulette).toBeUndefined();
  });

  it("can roll closed-hand roulette matches", () => {
    const opponent = PVE_OPPONENTS.find((candidate) => candidate.id === "roulette-savant");
    expect(opponent).toBeDefined();

    const rolls = Array.from({ length: 24 }, (_, index) =>
      resolvePveOpponentRules(opponent!, `match-seed-${index}`)
    );

    expect(rolls.some((rules) => !rules.open)).toBe(true);
  });

  it("can roll individual Same, individual Plus, and affinity-special combinations", () => {
    const opponent = PVE_OPPONENTS.find((candidate) => candidate.id === "roulette-savant");
    expect(opponent).toBeDefined();

    const rolls = Array.from({ length: 40 }, (_, index) =>
      resolvePveOpponentRules(opponent!, `match-seed-${index}`)
    );

    expect(rolls.some((rules) => rules.same && !rules.plus)).toBe(true);
    expect(rolls.some((rules) => !rules.same && rules.plus)).toBe(true);
    expect(
      rolls.some((rules) => (rules.legion || rules.decimation) && (rules.same || rules.plus))
    ).toBe(true);
    expect(rolls.every((rules) => !rules.combo)).toBe(true);
  });
});
