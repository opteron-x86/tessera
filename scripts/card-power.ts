import { CARD_TEMPLATES, PVE_OPPONENTS, STARTER_CARD_IDS, getCardTemplate } from "../src/game/content";
import { TIER_PV_BANDS, bandStatus, deckBracket, deckPower, powerValue } from "../src/game/power";
import type { CardTemplate } from "../src/game/types";

/**
 * Reports the Power Value (PV) of every card and flags any that fall outside
 * their tier's target band (content/cards/CORE-SET-PLAN.md §3). Also prints
 * Deck Power for the starter deck and each PvE opponent.
 *
 *   pnpm cards:power
 */

const pad = (value: string | number, width: number) => String(value).padEnd(width);
const padStart = (value: string | number, width: number) => String(value).padStart(width);

function sidesLabel(card: CardTemplate): string {
  const { top, right, bottom, left } = card.sides;
  return `${top}/${right}/${bottom}/${left}`;
}

function reportCards(): CardTemplate[] {
  const rows = [...CARD_TEMPLATES].sort(
    (a, b) => a.tier - b.tier || powerValue(b).total - powerValue(a).total
  );

  console.log("Card Power Values  (PV = SideSum + Corner + Same + Flex + Keywords)\n");
  console.log(
    pad("collector", 10) +
      pad("id", 22) +
      pad("rarity", 10) +
      pad("tier", 5) +
      pad("sides", 10) +
      padStart("Σ", 3) +
      "  " +
      pad("C/S/F", 7) +
      padStart("kw", 3) +
      padStart("PV", 5) +
      "  " +
      pad("band", 9) +
      "status"
  );

  const flagged: CardTemplate[] = [];

  for (const card of rows) {
    const pv = powerValue(card);
    const status = bandStatus(pv.total, card.tier);
    const [min, max] = TIER_PV_BANDS[card.tier];
    if (status !== "in") flagged.push(card);

    console.log(
      pad(card.collectorNumber ?? "—", 10) +
        pad(card.id, 22) +
        pad(card.rarity, 10) +
        pad(`T${card.tier}`, 5) +
        pad(sidesLabel(card), 10) +
        padStart(pv.sideSum, 3) +
        "  " +
        pad(`${pv.corner}/${pv.same}/${pv.flex}`, 7) +
        padStart(pv.keywords, 3) +
        padStart(pv.total, 5) +
        "  " +
        pad(`[${min}-${max}]`, 9) +
        (status === "in" ? "in" : status === "under" ? "UNDER ⚠" : "OVER ⚠")
    );
  }

  return flagged;
}

function reportFlagged(flagged: CardTemplate[]): void {
  console.log(`\n${flagged.length} card(s) outside their tier band:`);
  if (flagged.length === 0) {
    console.log("  none — every card sits inside its tier's PV band.");
    return;
  }
  for (const card of flagged) {
    const pv = powerValue(card);
    const [min, max] = TIER_PV_BANDS[card.tier];
    console.log(
      `  ${bandStatus(pv.total, card.tier).toUpperCase().padEnd(6)} ${pad(card.id, 22)} T${card.tier} PV ${pv.total} vs [${min}-${max}]`
    );
  }
}

function reportDecks(): void {
  console.log("\nDeck Power (Σ PV of 5 cards):");
  const starterPower = deckPower(STARTER_CARD_IDS.map(getCardTemplate));
  console.log(`  ${pad("Starter deck", 20)} ${padStart(starterPower, 4)}  ${deckBracket(starterPower).label}`);
  for (const opponent of PVE_OPPONENTS) {
    const power = deckPower(opponent.deckTemplateIds.map(getCardTemplate));
    console.log(`  ${pad(opponent.name, 20)} ${padStart(power, 4)}  ${deckBracket(power).label}`);
  }
}

reportFlagged(reportCards());
reportDecks();
