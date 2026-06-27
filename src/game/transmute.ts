import type { CardRarity } from "./types";

/** Base currency a card is worth when transmuted, by rarity. */
export const RARITY_TRANSMUTE_VALUE: Record<CardRarity, number> = {
  COMMON: 25,
  UNCOMMON: 60,
  RARE: 140,
  EPIC: 360,
  LEGENDARY: 900
};

/** Each upgrade level adds this much to the transmute value. */
export const UPGRADE_TRANSMUTE_BONUS = 20;

/** Currency gained from transmuting a card instance. Mirrors the server payout. */
export function transmuteValue(rarity: CardRarity, upgradeLevel = 0) {
  return RARITY_TRANSMUTE_VALUE[rarity] + upgradeLevel * UPGRADE_TRANSMUTE_BONUS;
}
