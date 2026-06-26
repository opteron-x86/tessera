import type {
  CardInstance,
  CardRarity,
  CardTemplate,
  Deck,
  PowerTier,
  RuleSet,
  Sides
} from "../game/types";

type DbTemplate = {
  id: string;
  name: string;
  series: string;
  collectorNumber: string | null;
  rarity: string;
  tier: number;
  affinity: string | null;
  sides: unknown;
  lore: string;
  artUrl: string | null;
  palette: unknown;
};

type DbCard = {
  id: string;
  ownerId: string;
  upgradeLevel: number;
  sleeveId: string | null;
  borderId: string | null;
  altArtId: string | null;
  template: DbTemplate;
};

export function toGameTemplate(template: DbTemplate): CardTemplate {
  const palette = template.palette as CardTemplate["palette"] | null;
  const gameTemplate: CardTemplate = {
    id: template.id,
    name: template.name,
    series: template.series,
    rarity: template.rarity as CardRarity,
    tier: template.tier as PowerTier,
    sides: template.sides as Sides,
    lore: template.lore,
    palette: palette ?? {
      primary: "#4f5d8f",
      secondary: "#d9c6ff",
      ink: "#151617"
    }
  };

  if (template.affinity) {
    gameTemplate.affinity = template.affinity;
  }
  if (template.collectorNumber) {
    gameTemplate.collectorNumber = template.collectorNumber;
  }
  if (template.artUrl) {
    gameTemplate.artUrl = template.artUrl;
  }

  return gameTemplate;
}

export function toGameCard(card: DbCard): CardInstance {
  const gameCard: CardInstance = {
    id: card.id,
    ownerId: card.ownerId,
    template: toGameTemplate(card.template),
    upgradeLevel: card.upgradeLevel
  };

  if (card.sleeveId) {
    gameCard.sleeveId = card.sleeveId;
  }
  if (card.borderId) {
    gameCard.borderId = card.borderId;
  }
  if (card.altArtId) {
    gameCard.altArtId = card.altArtId;
  }

  return gameCard;
}

export function toGameDeck(input: {
  id: string;
  ownerId: string;
  name: string;
  cards: Array<{
    position: number;
    card: DbCard;
  }>;
}): Deck {
  return {
    id: input.id,
    ownerId: input.ownerId,
    name: input.name,
    cards: input.cards
      .sort((left, right) => left.position - right.position)
      .map((slot) => toGameCard(slot.card))
  };
}

export function toRuleSet(value: unknown): RuleSet {
  return value as RuleSet;
}
