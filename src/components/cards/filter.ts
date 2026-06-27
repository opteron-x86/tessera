import type { CardInstance, CardRarity } from "@/game/types";

export type CardSort = "name" | "rarity" | "tier" | "affinity" | "owned";

export type CardGroup = { template: CardInstance["template"]; instances: CardInstance[] };

export type CardFilterState = {
  query: string;
  rarity: CardRarity | "ALL";
  affinity: string;
  sort: CardSort;
};

export const RARITY_FILTERS: Array<CardRarity | "ALL"> = [
  "ALL",
  "COMMON",
  "UNCOMMON",
  "RARE",
  "EPIC",
  "LEGENDARY"
];

export const SORT_OPTIONS: Array<{ value: CardSort; label: string }> = [
  { value: "name", label: "Name" },
  { value: "rarity", label: "Rarity" },
  { value: "tier", label: "Tier" },
  { value: "affinity", label: "Affinity" },
  { value: "owned", label: "Owned" }
];

const RARITY_ORDER: Record<CardRarity, number> = {
  COMMON: 0,
  UNCOMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4
};

/** Distinct affinities present in a card list, alphabetically sorted. */
export function listAffinities(cards: CardInstance[]): string[] {
  const set = new Set<string>();
  for (const card of cards) {
    if (card.template.affinity) set.add(card.template.affinity);
  }
  return [...set].sort();
}

/** Group cards by template, apply the active filters, and sort the result. */
export function groupAndFilterCards(cards: CardInstance[], filters: CardFilterState): CardGroup[] {
  const q = filters.query.trim().toLowerCase();
  const map = new Map<string, CardGroup>();
  for (const card of cards) {
    if (filters.rarity !== "ALL" && card.template.rarity !== filters.rarity) continue;
    if (filters.affinity !== "ALL" && card.template.affinity !== filters.affinity) continue;
    if (q && !card.template.name.toLowerCase().includes(q)) continue;
    const group = map.get(card.template.id) ?? { template: card.template, instances: [] };
    group.instances.push(card);
    map.set(card.template.id, group);
  }
  const list = [...map.values()];
  list.sort((a, b) => {
    switch (filters.sort) {
      case "rarity":
        return (
          RARITY_ORDER[b.template.rarity] - RARITY_ORDER[a.template.rarity] ||
          a.template.name.localeCompare(b.template.name)
        );
      case "tier":
        return b.template.tier - a.template.tier || a.template.name.localeCompare(b.template.name);
      case "affinity":
        return (
          (a.template.affinity ?? "~").localeCompare(b.template.affinity ?? "~") ||
          a.template.name.localeCompare(b.template.name)
        );
      case "owned":
        return (
          b.instances.length - a.instances.length || a.template.name.localeCompare(b.template.name)
        );
      default:
        return a.template.name.localeCompare(b.template.name);
    }
  });
  return list;
}
