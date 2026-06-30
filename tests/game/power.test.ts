import { describe, expect, it } from "vitest";
import {
  bandStatus,
  cornerBonus,
  deckBracket,
  deckPower,
  flexBonus,
  keywordBonus,
  powerValue,
  sameBonus,
  sideSum
} from "../../src/game/power";
import type { Sides } from "../../src/game/types";

const sides = (top: number, right: number, bottom: number, left: number): Sides => ({
  top,
  right,
  bottom,
  left
});

describe("power value", () => {
  it("computes the documented Piasa Whelp example", () => {
    expect(powerValue({ sides: sides(1, 5, 1, 4) })).toEqual({
      sideSum: 11,
      corner: 0,
      same: 1,
      flex: 0,
      keywords: 0,
      total: 12
    });
  });

  it("treats a vanilla legendary as under its tier band", () => {
    // Leraye 7/6/4/8 — Σ25, +1 corner = 26; T6 band is [28, 32].
    const pv = powerValue({ sides: sides(7, 6, 4, 8) });
    expect(pv.total).toBe(26);
    expect(bandStatus(pv.total, 6)).toBe("under");
  });

  it("clamps corner and scores same by multiplicity", () => {
    expect(cornerBonus(sides(1, 11, 11, 1))).toBe(4); // raw 5, capped at 4
    expect(sameBonus(sides(5, 5, 5, 5))).toBe(3); // quad, capped at 3
    expect(sameBonus(sides(5, 5, 5, 2))).toBe(2); // triple
    expect(sameBonus(sides(5, 5, 2, 3))).toBe(1); // pair
  });

  it("scores flex by side spread", () => {
    expect(flexBonus(sides(5, 5, 4, 3))).toBe(2); // spread 2
    expect(flexBonus(sides(5, 4, 3, 2))).toBe(1); // spread 3
    expect(flexBonus(sides(6, 2, 2, 2))).toBe(0); // spread 4
  });

  it("sums known keyword points and ignores unknown ones", () => {
    expect(keywordBonus(["Ward", "echo"])).toBe(10);
    expect(keywordBonus(["mystery"])).toBe(0);
    expect(keywordBonus()).toBe(0);
  });

  it("adds keyword points into the total", () => {
    const vanilla = powerValue({ sides: sides(7, 6, 4, 8) });
    const warded = powerValue({ sides: sides(7, 6, 4, 8), keywords: ["ward"] });
    expect(warded.total).toBe(vanilla.total + 5);
  });

  it("reports band status relative to the tier", () => {
    expect(bandStatus(14, 1)).toBe("in"); // [12, 16]
    expect(bandStatus(11, 1)).toBe("under");
    expect(bandStatus(17, 1)).toBe("over");
  });

  it("sums deck power across cards", () => {
    expect(deckPower([{ sides: sides(1, 5, 1, 4) }, { sides: sides(7, 6, 4, 8) }])).toBe(12 + 26);
    expect(sideSum(sides(1, 2, 3, 4))).toBe(10);
  });

  it("maps deck power to a matchmaking bracket", () => {
    expect(deckBracket(60).id).toBe("wayfarer"); // [0, 75)
    expect(deckBracket(75).id).toBe("seasoned"); // [75, 110)
    expect(deckBracket(110).id).toBe("veteran"); // [110, 150)
    expect(deckBracket(150).id).toBe("champion"); // [150, ∞)
  });
});
