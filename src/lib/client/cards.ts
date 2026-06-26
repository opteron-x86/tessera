import type { Affinity, CardInstance, CardTemplate, Sides } from "@/game/types";
import type { SnapshotCard } from "./api";

export function normalizeSides(sides: Sides): Sides {
  return {
    top: Number(sides.top),
    right: Number(sides.right),
    bottom: Number(sides.bottom),
    left: Number(sides.left)
  };
}

export function toCardInstance(card: SnapshotCard): CardInstance {
  return {
    id: card.id,
    ownerId: card.ownerId,
    upgradeLevel: card.upgradeLevel,
    template: {
      ...card.template,
      sides: normalizeSides(card.template.sides)
    }
  };
}

export function formatSides(sides: Sides) {
  const n = normalizeSides(sides);
  return `${n.top}/${n.right}/${n.bottom}/${n.left}`;
}

const RARITY_VAR: Record<CardTemplate["rarity"], string> = {
  COMMON: "var(--tier-common)",
  UNCOMMON: "var(--tier-uncommon)",
  RARE: "var(--tier-rare)",
  EPIC: "var(--tier-epic)",
  LEGENDARY: "var(--tier-legendary)"
};

export function rarityColor(rarity: CardTemplate["rarity"]) {
  return RARITY_VAR[rarity];
}

export function isHolo(rarity: CardTemplate["rarity"]) {
  return rarity === "EPIC" || rarity === "LEGENDARY";
}

const AFFINITY_VAR: Record<string, string> = {
  Beast: "var(--affinity-beast)",
  Human: "var(--affinity-human)",
  Construct: "var(--affinity-construct)",
  Undead: "var(--affinity-undead)",
  Eldritch: "var(--affinity-eldritch)",
  Myrathi: "var(--affinity-myrathi)",
  Kynathi: "var(--affinity-kynathi)"
};

export function affinityColor(affinity?: Affinity) {
  return affinity ? (AFFINITY_VAR[affinity] ?? "var(--accent)") : "var(--accent)";
}
