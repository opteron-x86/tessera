export type PlayerSlot = "one" | "two";
export type MatchPhase = "lobby" | "active" | "complete" | "abandoned";
export type CardRarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
export type PowerTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type Affinity = string;
export type AiTier = "beginner" | "standard" | "expert" | "master";

export type Sides = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type CardTemplate = {
  id: string;
  name: string;
  series: string;
  collectorNumber?: string;
  rarity: CardRarity;
  tier: PowerTier;
  affinity?: Affinity;
  sides: Sides;
  lore: string;
  artUrl?: string;
  palette: {
    primary: string;
    secondary: string;
    ink: string;
  };
};

export type CardInstance = {
  id: string;
  ownerId: string;
  template: CardTemplate;
  upgradeLevel: number;
  sleeveId?: string;
  borderId?: string;
  altArtId?: string;
};

export type Deck = {
  id: string;
  ownerId: string;
  name: string;
  cards: CardInstance[];
};

export type RuleSet = {
  open: boolean;
  same: boolean;
  plus: boolean;
  combo: boolean;
  sameWall?: boolean;
  random?: boolean;
  legion?: boolean;
  decimation?: boolean;
  suddenDeath?: boolean;
};

export type RuleModule = {
  id: keyof RuleSet | string;
  label: string;
  setup?: (state: GameState) => GameState;
  validateMove?: (state: GameState, command: PlayCardCommand) => string | null;
  resolveCaptures?: (state: GameState, command: PlayCardCommand) => CaptureResult;
  resolveEndgame?: (state: GameState) => GameState;
  rewardHook?: (state: GameState) => GameState;
};

export type BoardCell = {
  index: number;
  owner: PlayerSlot;
  card: CardInstance;
};

export type Score = Record<PlayerSlot, number>;

export type GameState = {
  id: string;
  seed: string;
  phase: MatchPhase;
  rules: RuleSet;
  board: Array<BoardCell | null>;
  hands: Record<PlayerSlot, CardInstance[]>;
  currentPlayer: PlayerSlot;
  scores: Score;
  winner: PlayerSlot | "draw" | null;
  moveNumber: number;
  events: MatchEvent[];
};

export type PlayCardCommand = {
  type: "PLAY_CARD";
  player: PlayerSlot;
  cardId: string;
  position: number;
};

export type ConcedeCommand = {
  type: "CONCEDE";
  player: PlayerSlot;
};

export type MatchCommand = PlayCardCommand | ConcedeCommand;

export type MatchEvent =
  | {
      type: "CARD_PLACED";
      player: PlayerSlot;
      cardId: string;
      position: number;
      moveNumber: number;
    }
  | {
      type: "CARDS_CAPTURED";
      player: PlayerSlot;
      positions: number[];
      reason: "normal" | "same" | "plus" | "combo";
      moveNumber: number;
    }
  | {
      type: "MATCH_FINISHED";
      winner: PlayerSlot | "draw";
      scores: Score;
      moveNumber: number;
    }
  | {
      type: "MATCH_CONCEDED";
      player: PlayerSlot;
      winner: PlayerSlot;
      moveNumber: number;
    };

export type CaptureReason = "normal" | "same" | "plus" | "combo";

export type CaptureResult = {
  captured: Array<{
    position: number;
    reason: CaptureReason;
  }>;
};

export type PveOpponent = {
  id: string;
  name: string;
  difficulty: number;
  aiTier: AiTier;
  deckTemplateIds: string[];
  deckAffinity?: Affinity;
  ruleSet: RuleSet;
  rewardCurrency: number;
  tutorialCopy: string;
  unlockAfterId?: string;
};

export type BoosterPack = {
  id: string;
  name: string;
  price: number;
  description: string;
  slots: Array<{
    rarity: CardRarity;
    count: number;
    chanceUpgrades?: Partial<Record<CardRarity, number>>;
  }>;
};
