import type {
  BoosterPack,
  CardInstance,
  CardTemplate,
  CardRarity,
  PowerTier,
  PveOpponent,
  RuleSet
} from "./types";
import { CARD_TEMPLATES } from "./content.generated";
import { chooseWeighted, createRng } from "./rng";

export { CARD_TEMPLATES };

type AiDeckRarity = Extract<CardRarity, "COMMON" | "UNCOMMON" | "RARE">;

const AI_DECK_RARITIES: AiDeckRarity[] = ["COMMON", "UNCOMMON", "RARE"];
const AI_DECK_SIZE = 5;

export const CORE_RULES: RuleSet = {
  open: true,
  same: false,
  plus: false,
  combo: false
};

export const SAME_RULES: RuleSet = {
  open: true,
  same: true,
  plus: false,
  combo: false
};

export const PLUS_RULES: RuleSet = {
  open: true,
  same: false,
  plus: true,
  combo: false
};

export const SAME_PLUS_RULES: RuleSet = {
  open: true,
  same: true,
  plus: true,
  combo: false
};

export const LEGION_RULES: RuleSet = {
  open: true,
  same: false,
  plus: false,
  combo: false,
  legion: true
};

export const DECIMATION_RULES: RuleSet = {
  open: true,
  same: false,
  plus: false,
  combo: false,
  decimation: true
};

export const ROULETTE_RULES: RuleSet = {
  open: false,
  same: false,
  plus: false,
  combo: false,
  roulette: true
};

const ROULETTE_RULE_OPTIONS: RuleSet[] = [
  CORE_RULES,
  {
    open: false,
    same: false,
    plus: false,
    combo: false
  },
  SAME_RULES,
  PLUS_RULES,
  SAME_PLUS_RULES,
  {
    open: false,
    same: true,
    plus: false,
    combo: false
  },
  {
    open: false,
    same: false,
    plus: true,
    combo: false
  },
  {
    open: false,
    same: true,
    plus: true,
    combo: false
  },
  LEGION_RULES,
  {
    open: false,
    same: false,
    plus: false,
    combo: false,
    legion: true
  },
  DECIMATION_RULES,
  {
    open: false,
    same: false,
    plus: false,
    combo: false,
    decimation: true
  },
  {
    open: true,
    same: true,
    plus: false,
    combo: false,
    legion: true
  },
  {
    open: true,
    same: false,
    plus: true,
    combo: false,
    legion: true
  },
  {
    open: true,
    same: true,
    plus: true,
    combo: false,
    legion: true
  },
  {
    open: true,
    same: true,
    plus: false,
    combo: false,
    decimation: true
  },
  {
    open: true,
    same: false,
    plus: true,
    combo: false,
    decimation: true
  },
  {
    open: true,
    same: true,
    plus: true,
    combo: false,
    decimation: true
  }
];

export const STARTER_CARD_IDS = [
  "piasa-whelp",
  "dire-wolf",
  "wooly-rhino",
  "sparmos-blacksmith",
  "adze"
];

export const PVE_OPPONENTS: PveOpponent[] = [
  {
    id: "old-road-tutor",
    name: "Old Road Tutor",
    difficulty: 1,
    aiTier: "beginner",
    deckTemplateIds: [
      "piasa-whelp",
      "dire-wolf",
      "wooly-rhino",
      "areneid",
      "rotted-zombie"
    ],
    ruleSet: CORE_RULES,
    rewardCurrency: 80,
    tutorialCopy: "The first lesson is simple: stronger sides take weaker neighbors."
  },
  {
    id: "market-duelist",
    name: "Market Duelist",
    difficulty: 2,
    aiTier: "standard",
    deckTemplateIds: [
      "ghuler",
      "ghoul",
      "moonwell-diver",
      "forest-troll",
      "roc"
    ],
    ruleSet: SAME_RULES,
    rewardCurrency: 120,
    tutorialCopy: "The market tables teach Same first; matching sides can turn a duel sharply.",
    unlockAfterId: "old-road-tutor"
  },
  {
    id: "legion-banneret",
    name: "Legion Banneret",
    difficulty: 3,
    aiTier: "standard",
    deckTemplateIds: [
      "piasa-whelp",
      "dire-wolf",
      "wooly-rhino",
      "roc",
      "forest-troll"
    ],
    deckAffinity: "Beast",
    ruleSet: LEGION_RULES,
    rewardCurrency: 150,
    tutorialCopy: "The banneret turns matching affinities into battlefield momentum.",
    unlockAfterId: "market-duelist"
  },
  {
    id: "decimation-oracle",
    name: "Decimation Oracle",
    difficulty: 4,
    aiTier: "expert",
    deckTemplateIds: [
      "rotted-zombie",
      "brittle-skeleton",
      "ghuler",
      "ghoul",
      "squonk"
    ],
    deckAffinity: "Undead",
    ruleSet: DECIMATION_RULES,
    rewardCurrency: 180,
    tutorialCopy: "The oracle makes crowded affinities brittle at the worst possible moment.",
    unlockAfterId: "legion-banneret"
  },
  {
    id: "roulette-savant",
    name: "Roulette Savant",
    difficulty: 5,
    aiTier: "master",
    deckTemplateIds: [
      "myrathi-tidecaller",
      "flesh-amalgamation",
      "snallygaster",
      "ember-page",
      "sparmos-blacksmith"
    ],
    ruleSet: ROULETTE_RULES,
    ruleRoulette: true,
    rewardCurrency: 240,
    tutorialCopy: "The savant spins the laws of the match before the first card falls.",
    unlockAfterId: "decimation-oracle"
  }
];

export const BOOSTER_PACKS: BoosterPack[] = [
  {
    id: "wayfarer-pack",
    name: "Wayfarer Pack",
    price: 120,
    description: "Five cards from the first roads of Tessera.",
    slots: [
      {
        rarity: "COMMON",
        count: 3
      },
      {
        rarity: "UNCOMMON",
        count: 1,
        chanceUpgrades: {
          RARE: 0.2
        }
      },
      {
        rarity: "COMMON",
        count: 1,
        chanceUpgrades: {
          UNCOMMON: 0.35,
          RARE: 0.08,
          EPIC: 0.02
        }
      }
    ]
  }
];

export function getCardTemplate(id: string): CardTemplate {
  const template = CARD_TEMPLATES.find((card) => card.id === id);
  if (!template) {
    throw new Error(`Unknown card template: ${id}`);
  }

  return template;
}

export function getCardsByRarity(rarity: CardRarity): CardTemplate[] {
  return CARD_TEMPLATES.filter((card) => card.rarity === rarity);
}

export function getCardsByPowerTier(tier: PowerTier): CardTemplate[] {
  return CARD_TEMPLATES.filter((card) => card.tier === tier);
}

export function resolvePveOpponentRules(opponent: PveOpponent, seed: string): RuleSet {
  if (!opponent.ruleRoulette) {
    return { ...opponent.ruleSet };
  }

  const random = createRng(`${seed}:${opponent.id}:rules`);
  const option = ROULETTE_RULE_OPTIONS[Math.floor(random() * ROULETTE_RULE_OPTIONS.length)]!;
  return { ...option };
}

export function makeCardInstance(
  templateId: string,
  ownerId: string,
  nonce: string
): CardInstance {
  return {
    id: `${ownerId}-${templateId}-${nonce}`,
    ownerId,
    template: getCardTemplate(templateId),
    upgradeLevel: 0
  };
}

export function makeDeck(
  id: string,
  ownerId: string,
  name: string,
  templateIds: string[]
) {
  return {
    id,
    ownerId,
    name,
    cards: templateIds.map((templateId, index) =>
      makeCardInstance(templateId, ownerId, `${id}-${index}`)
    )
  };
}

export function makeWeightedAiDeck(
  id: string,
  ownerId: string,
  name: string,
  seed: string,
  difficulty: number,
  affinityFocus?: string
) {
  return makeDeck(id, ownerId, name, chooseWeightedAiDeckTemplateIds(seed, difficulty, affinityFocus));
}

export function chooseWeightedAiDeckTemplateIds(
  seed: string,
  difficulty: number,
  affinityFocus?: string
) {
  const available = AI_DECK_RARITIES.flatMap((rarity) => getCardsByRarity(rarity));
  if (available.length < AI_DECK_SIZE) {
    throw new Error("Not enough common, uncommon, and rare cards to build an AI deck.");
  }

  const random = createRng(`${seed}:ai-deck`);
  const selected = new Set<string>();
  const weights = aiDeckRarityWeights(difficulty);

  const chooseTemplateId = (filter?: (template: CardTemplate) => boolean) => {
    const rarityChoices = weights.filter(({ rarity }) =>
      available.some(
        (template) =>
          template.rarity === rarity &&
          !selected.has(template.id) &&
          (!filter || filter(template))
      )
    );
    const rarity = chooseWeighted(
      rarityChoices.map(({ rarity, weight }) => ({ value: rarity, weight })),
      random
    );
    const candidates = available.filter(
      (template) =>
        template.rarity === rarity &&
        !selected.has(template.id) &&
        (!filter || filter(template))
    );
    return candidates[Math.floor(random() * candidates.length)]!.id;
  };

  if (affinityFocus) {
    const focusCount = available.filter((template) => template.affinity === affinityFocus).length;
    const focusTarget = Math.min(3, focusCount, AI_DECK_SIZE);
    while (selected.size < focusTarget) {
      selected.add(chooseTemplateId((template) => template.affinity === affinityFocus));
    }
  }

  while (selected.size < AI_DECK_SIZE) {
    selected.add(chooseTemplateId());
  }

  return [...selected];
}

function aiDeckRarityWeights(difficulty: number): Array<{ rarity: AiDeckRarity; weight: number }> {
  if (difficulty <= 1) {
    return [
      { rarity: "COMMON", weight: 88 },
      { rarity: "UNCOMMON", weight: 11 },
      { rarity: "RARE", weight: 1 }
    ];
  }

  if (difficulty === 2) {
    return [
      { rarity: "COMMON", weight: 72 },
      { rarity: "UNCOMMON", weight: 22 },
      { rarity: "RARE", weight: 6 }
    ];
  }

  return [
    { rarity: "COMMON", weight: 58 },
    { rarity: "UNCOMMON", weight: 30 },
    { rarity: "RARE", weight: 12 }
  ];
}
