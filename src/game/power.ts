import type { PowerTier, Sides } from "./types";

/**
 * Card Power Value (PV) model — see content/cards/CORE-SET-PLAN.md §3.
 *
 * PV = SideSum + Shape + Keywords, computed deterministically from a card.
 * Pure and side-effect free so the deck builder, matchmaking, and balance
 * tooling can all share one definition of "how strong is this card".
 */

/** Keyword PV points — starter weights (validate against self-play). Phase 2.1. */
export const KEYWORD_PV: Record<string, number> = {
  ward: 5,
  echo: 5,
  surge: 4,
  bulwark: 3,
  ambush: 2
};

/**
 * Target total-PV band per tier, inclusive [min, max]. Calibrated against the
 * current catalog (`pnpm cards:power`) so most cards sit in-band and only true
 * outliers flag — re-tune as content and keyword weights evolve.
 */
export const TIER_PV_BANDS: Record<PowerTier, readonly [number, number]> = {
  1: [12, 16],
  2: [15, 19],
  3: [18, 22],
  4: [21, 25],
  5: [24, 28],
  6: [27, 31],
  7: [30, 34],
  8: [33, 37],
  9: [36, 40],
  10: [39, 44]
};

/** A card's sides plus any keywords it carries. CardTemplate is assignable. */
export type PowerInput = {
  sides: Sides;
  keywords?: readonly string[];
};

export type PowerBreakdown = {
  sideSum: number;
  corner: number;
  same: number;
  flex: number;
  keywords: number;
  total: number;
};

export type BandStatus = "under" | "in" | "over";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const sideValues = (sides: Sides): number[] => [sides.top, sides.right, sides.bottom, sides.left];

/** Sum of all four sides (4–44). The backbone of PV. */
export function sideSum(sides: Sides): number {
  return sides.top + sides.right + sides.bottom + sides.left;
}

/** Corner viability: rewards a strong best-corner (two high adjacent sides). */
export function cornerBonus(sides: Sides): number {
  const adjacentPairs = [
    sides.top + sides.right,
    sides.right + sides.bottom,
    sides.bottom + sides.left,
    sides.left + sides.top
  ];
  const maxAdjacent = Math.max(...adjacentPairs);
  return clamp(Math.round((maxAdjacent - sideSum(sides) / 2) * 0.5), 0, 4);
}

/**
 * Same viability: rewards repeated side values that fish for Same captures.
 * A lone pair is a small nudge (+1); triples/quads matter more (+2/+3).
 */
export function sameBonus(sides: Sides): number {
  const counts = new Map<number, number>();
  for (const value of sideValues(sides)) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const maxMultiplicity = Math.max(...counts.values());
  return clamp(maxMultiplicity - 1, 0, 3);
}

/** Plus/flex viability: rewards balanced sides (low spread) for center play. */
export function flexBonus(sides: Sides): number {
  const values = sideValues(sides);
  const spread = Math.max(...values) - Math.min(...values);
  if (spread <= 2) return 2;
  if (spread <= 3) return 1;
  return 0;
}

/** Total keyword points for a card's abilities (unknown keywords score 0). */
export function keywordBonus(keywords: readonly string[] = []): number {
  return keywords.reduce((total, keyword) => total + (KEYWORD_PV[keyword.toLowerCase()] ?? 0), 0);
}

/** Full PV breakdown for a card. */
export function powerValue(card: PowerInput): PowerBreakdown {
  const sideSumValue = sideSum(card.sides);
  const corner = cornerBonus(card.sides);
  const same = sameBonus(card.sides);
  const flex = flexBonus(card.sides);
  const keywords = keywordBonus(card.keywords);
  return {
    sideSum: sideSumValue,
    corner,
    same,
    flex,
    keywords,
    total: sideSumValue + corner + same + flex + keywords
  };
}

/** Where a PV falls relative to a tier's target band. */
export function bandStatus(total: number, tier: PowerTier): BandStatus {
  const [min, max] = TIER_PV_BANDS[tier];
  if (total < min) return "under";
  if (total > max) return "over";
  return "in";
}

/** Deck Power = sum of each card's PV. Used for matchmaking and balance. */
export function deckPower(cards: readonly PowerInput[]): number {
  return cards.reduce((total, card) => total + powerValue(card).total, 0);
}

export type MatchmakingBracket = {
  id: string;
  label: string;
  /** Inclusive lower bound on Deck Power. */
  min: number;
};

/** Deck Power matchmaking brackets, highest first (CORE-SET-PLAN.md §2). */
export const MATCHMAKING_BRACKETS: readonly MatchmakingBracket[] = [
  { id: "champion", label: "IV — Champion", min: 150 },
  { id: "veteran", label: "III — Veteran", min: 110 },
  { id: "seasoned", label: "II — Seasoned", min: 75 },
  { id: "wayfarer", label: "I — Wayfarer", min: 0 }
];

/** The bracket a Deck Power falls into. */
export function deckBracket(power: number): MatchmakingBracket {
  return MATCHMAKING_BRACKETS.find((bracket) => power >= bracket.min) ?? MATCHMAKING_BRACKETS.at(-1)!;
}
