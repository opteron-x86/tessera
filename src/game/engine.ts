import type {
  BoardCell,
  CaptureReason,
  CaptureResult,
  CardInstance,
  Deck,
  GameState,
  MatchCommand,
  MatchEvent,
  PlayCardCommand,
  PlayerSlot,
  RuleSet,
  Score,
  Sides
} from "./types";
import { createRng } from "./rng";

type Direction = "top" | "right" | "bottom" | "left";

const DIRECTIONS: Array<{
  side: Direction;
  opposite: Direction;
  offset: number;
  allowed: (index: number) => boolean;
}> = [
  {
    side: "top",
    opposite: "bottom",
    offset: -3,
    allowed: (index) => index > 2
  },
  {
    side: "right",
    opposite: "left",
    offset: 1,
    allowed: (index) => index % 3 !== 2
  },
  {
    side: "bottom",
    opposite: "top",
    offset: 3,
    allowed: (index) => index < 6
  },
  {
    side: "left",
    opposite: "right",
    offset: -1,
    allowed: (index) => index % 3 !== 0
  }
];

export function otherPlayer(player: PlayerSlot): PlayerSlot {
  return player === "one" ? "two" : "one";
}

export function validateDeck(deck: Deck): string[] {
  const errors: string[] = [];
  if (deck.cards.length !== 5) {
    errors.push("A Tessera deck must contain exactly 5 cards.");
  }

  const uniqueCards = new Set(deck.cards.map((card) => card.id));
  if (uniqueCards.size !== deck.cards.length) {
    errors.push("A deck cannot contain the same owned card twice.");
  }

  return errors;
}

export function createGame(args: {
  id?: string;
  seed: string;
  rules: RuleSet;
  playerOneDeck: Deck;
  playerTwoDeck: Deck;
}): GameState {
  const oneErrors = validateDeck(args.playerOneDeck);
  const twoErrors = validateDeck(args.playerTwoDeck);
  if (oneErrors.length || twoErrors.length) {
    throw new Error([...oneErrors, ...twoErrors].join(" "));
  }

  const state: GameState = {
    id: args.id ?? `match-${args.seed}`,
    seed: args.seed,
    phase: "active",
    rules: args.rules,
    board: Array.from({ length: 9 }, () => null),
    hands: {
      one: cloneCards(args.playerOneDeck.cards),
      two: cloneCards(args.playerTwoDeck.cards)
    },
    currentPlayer: chooseFirstPlayer(args.seed),
    scores: {
      one: 5,
      two: 5
    },
    winner: null,
    moveNumber: 0,
    events: []
  };

  return {
    ...state,
    scores: calculateScores(state)
  };
}

export function chooseFirstPlayer(seed: string): PlayerSlot {
  const rng = createRng(`${seed}:first-player`);
  return rng() < 0.5 ? "one" : "two";
}

export function applyCommand(state: GameState, command: MatchCommand): GameState {
  if (command.type === "CONCEDE") {
    return concede(state, command.player);
  }

  return playCard(state, command);
}

export function playCard(state: GameState, command: PlayCardCommand): GameState {
  validatePlay(state, command);

  const next = cloneState(state);
  const hand = next.hands[command.player];
  const cardIndex = hand.findIndex((card) => card.id === command.cardId);
  const [card] = hand.splice(cardIndex, 1);
  const placed: BoardCell = {
    index: command.position,
    owner: command.player,
    card: card!
  };
  next.board[command.position] = placed;
  next.moveNumber += 1;

  const ruleEvents = affinityRuleTriggerEvents(state, placed, command.player, next.moveNumber);
  const captureState: GameState = {
    ...next,
    events: [...next.events, ...ruleEvents]
  };
  const captureResult = resolveCaptures(captureState, command);
  for (const capture of captureResult.captured) {
    const cell = next.board[capture.position];
    if (cell) {
      cell.owner = command.player;
    }
  }

  const events: MatchEvent[] = [
    {
      type: "CARD_PLACED",
      player: command.player,
      cardId: command.cardId,
      position: command.position,
      moveNumber: next.moveNumber
    },
    ...ruleEvents,
    ...captureEvents(command.player, captureResult, next.moveNumber)
  ];

  next.scores = calculateScores(next);
  next.currentPlayer = otherPlayer(command.player);
  next.events = [...next.events, ...events];

  if (isGameFinished(next)) {
    return finishGame(next);
  }

  return next;
}

export function validatePlay(state: GameState, command: PlayCardCommand): void {
  if (state.phase !== "active") {
    throw new Error("This match is not active.");
  }

  if (command.player !== state.currentPlayer) {
    throw new Error("It is not this player's turn.");
  }

  if (command.position < 0 || command.position > 8) {
    throw new Error("Board position is outside the 3x3 grid.");
  }

  if (state.board[command.position]) {
    throw new Error("Board position is already occupied.");
  }

  if (!state.hands[command.player].some((card) => card.id === command.cardId)) {
    throw new Error("The selected card is not in this player's hand.");
  }
}

export function resolveCaptures(
  state: GameState,
  command: PlayCardCommand
): CaptureResult {
  const placed = state.board[command.position];
  if (!placed) {
    return { captured: [] };
  }

  const captured = new Map<number, CaptureReason>();

  for (const capture of normalCaptures(state, placed)) {
    captured.set(capture.position, "normal");
  }

  const specialSeeds: number[] = [];
  if (state.rules.same) {
    const same = sameCaptures(state, placed);
    for (const position of same) {
      captured.set(position, "same");
      specialSeeds.push(position);
    }
  }

  if (state.rules.plus) {
    const plus = plusCaptures(state, placed);
    for (const position of plus) {
      captured.set(position, "plus");
      specialSeeds.push(position);
    }
  }

  if (state.rules.combo && specialSeeds.length > 0) {
    const combo = comboCaptures(state, command.player, specialSeeds, captured);
    for (const position of combo) {
      captured.set(position, "combo");
    }
  }

  return {
    captured: [...captured.entries()].map(([position, reason]) => ({
      position,
      reason
    }))
  };
}

export function calculateScores(state: GameState): Score {
  const scores: Score = {
    one: state.hands.one.length,
    two: state.hands.two.length
  };

  for (const cell of state.board) {
    if (cell) {
      scores[cell.owner] += 1;
    }
  }

  return scores;
}

export function finishGame(state: GameState): GameState {
  const next = cloneState(state);
  next.phase = "complete";
  next.scores = calculateScores(next);
  next.winner =
    next.scores.one === next.scores.two
      ? "draw"
      : next.scores.one > next.scores.two
        ? "one"
        : "two";
  next.events.push({
    type: "MATCH_FINISHED",
    winner: next.winner,
    scores: next.scores,
    moveNumber: next.moveNumber
  });

  return next;
}

export function emptyPositions(state: GameState): number[] {
  return state.board
    .map((cell, index) => (cell ? null : index))
    .filter((index): index is number => index !== null);
}

function concede(state: GameState, player: PlayerSlot): GameState {
  if (state.phase !== "active") {
    throw new Error("Only active matches can be conceded.");
  }

  const next = cloneState(state);
  const winner = otherPlayer(player);
  next.phase = "complete";
  next.winner = winner;
  next.events.push({
    type: "MATCH_CONCEDED",
    player,
    winner,
    moveNumber: next.moveNumber
  });
  return next;
}

function normalCaptures(
  state: GameState,
  source: BoardCell
): Array<{ position: number }> {
  return DIRECTIONS.flatMap((direction) => {
    if (!direction.allowed(source.index)) {
      return [];
    }

    const board = state.board;
    const neighbor = board[source.index + direction.offset];
    if (!neighbor || neighbor.owner === source.owner) {
      return [];
    }

    const attack = effectiveSidesForCard(source.card, state.rules, board, state.events)[
      direction.side
    ];
    const defense = effectiveSidesForCell(neighbor, state.rules, board, state.events)[
      direction.opposite
    ];
    return attack > defense ? [{ position: neighbor.index }] : [];
  });
}

function sameCaptures(state: GameState, source: BoardCell): number[] {
  const sourceSides = effectiveSidesForCard(source.card, state.rules, state.board, state.events);
  const matches = adjacentCells(state.board, source).filter(({ direction, cell }) => {
    if (cell.owner === source.owner) {
      return false;
    }

    const cellSides = effectiveSidesForCell(cell, state.rules, state.board, state.events);
    return sourceSides[direction.side] === cellSides[direction.opposite];
  });

  if (matches.length < 2) {
    return [];
  }

  return matches.map(({ cell }) => cell.index);
}

function plusCaptures(state: GameState, source: BoardCell): number[] {
  const sums = new Map<number, BoardCell[]>();
  const sourceSides = effectiveSidesForCard(source.card, state.rules, state.board, state.events);

  for (const { direction, cell } of adjacentCells(state.board, source)) {
    if (cell.owner === source.owner) {
      continue;
    }

    const cellSides = effectiveSidesForCell(cell, state.rules, state.board, state.events);
    const sum =
      sourceSides[direction.side] +
      cellSides[direction.opposite];
    sums.set(sum, [...(sums.get(sum) ?? []), cell]);
  }

  const captures = new Set<number>();
  for (const cells of sums.values()) {
    if (cells.length >= 2) {
      for (const cell of cells) {
        captures.add(cell.index);
      }
    }
  }

  return [...captures];
}

function comboCaptures(
  state: GameState,
  owner: PlayerSlot,
  seeds: number[],
  existingCaptures: Map<number, CaptureReason>
): number[] {
  const captured = new Set<number>();
  const queue = [...new Set(seeds)];

  while (queue.length > 0) {
    const index = queue.shift()!;
    const board = state.board;
    const source = board[index];
    if (!source) {
      continue;
    }

    const comboSource: BoardCell = {
      ...source,
      owner
    };

    for (const capture of normalCaptures(state, comboSource)) {
      if (!existingCaptures.has(capture.position) && !captured.has(capture.position)) {
        captured.add(capture.position);
        queue.push(capture.position);
      }
    }
  }

  return [...captured];
}

export function effectiveSidesForCell(
  cell: BoardCell,
  rules: RuleSet,
  board: Array<BoardCell | null>,
  events: MatchEvent[] = []
) {
  return effectiveSidesForCard(cell.card, rules, board, events);
}

export function effectiveSidesForCard(
  card: CardInstance,
  rules: RuleSet,
  board: Array<BoardCell | null>,
  events: MatchEvent[] = []
): Sides {
  const modifier = affinitySideModifier(rules, board, card.template.affinity, events);
  if (modifier === 0) {
    return card.template.sides;
  }

  return {
    top: clampSide(card.template.sides.top + modifier),
    right: clampSide(card.template.sides.right + modifier),
    bottom: clampSide(card.template.sides.bottom + modifier),
    left: clampSide(card.template.sides.left + modifier)
  };
}

function affinitySideModifier(
  rules: RuleSet,
  board: Array<BoardCell | null>,
  affinity?: string,
  events: MatchEvent[] = []
) {
  if (!affinity || (!rules.legion && !rules.decimation)) {
    return 0;
  }

  const matchingCards = board.filter((cell) => cell?.card.template.affinity === affinity).length;
  if (matchingCards < 3) {
    return 0;
  }

  const legionActive = rules.legion && hasRuleTriggered(events, "legion", affinity);
  const decimationActive =
    rules.decimation && hasRuleTriggered(events, "decimation", affinity);

  return (legionActive ? 1 : 0) - (decimationActive ? 1 : 0);
}

function clampSide(value: number) {
  return Math.min(11, Math.max(1, value));
}

function affinityRuleTriggerEvents(
  previousState: GameState,
  placed: BoardCell,
  player: PlayerSlot,
  moveNumber: number
): MatchEvent[] {
  const affinity = placed.card.template.affinity;
  if (!affinity || (!previousState.rules.legion && !previousState.rules.decimation)) {
    return [];
  }

  const previousCount = previousState.board.filter(
    (cell) => cell?.card.template.affinity === affinity
  ).length;
  const nextCount = previousCount + 1;
  if (previousCount >= 3 || nextCount < 3) {
    return [];
  }

  const triggeredRules = [
    previousState.rules.legion && !hasRuleTriggered(previousState.events, "legion")
      ? "legion"
      : null,
    previousState.rules.decimation && !hasRuleTriggered(previousState.events, "decimation")
      ? "decimation"
      : null
  ].filter((rule): rule is "legion" | "decimation" => rule !== null);

  return triggeredRules.map((rule) => ({
    type: "RULE_TRIGGERED",
    player,
    rule,
    affinity,
    moveNumber
  }));
}

function hasRuleTriggered(
  events: MatchEvent[],
  rule: "legion" | "decimation",
  affinity?: string
) {
  return events.some(
    (event) =>
      event.type === "RULE_TRIGGERED" &&
      event.rule === rule &&
      (affinity === undefined || event.affinity === affinity)
  );
}

function adjacentCells(board: Array<BoardCell | null>, source: BoardCell) {
  return DIRECTIONS.flatMap((direction) => {
    if (!direction.allowed(source.index)) {
      return [];
    }

    const cell = board[source.index + direction.offset];
    return cell ? [{ direction, cell }] : [];
  });
}

function isGameFinished(state: GameState): boolean {
  return state.board.every(Boolean) || state.hands.one.length === 0 || state.hands.two.length === 0;
}

function captureEvents(
  player: PlayerSlot,
  result: CaptureResult,
  moveNumber: number
): MatchEvent[] {
  const grouped = result.captured.reduce(
    (groups, capture) => {
      groups[capture.reason].push(capture.position);
      return groups;
    },
    {
      normal: [] as number[],
      same: [] as number[],
      plus: [] as number[],
      combo: [] as number[]
    }
  );

  return (Object.entries(grouped) as Array<[CaptureReason, number[]]>)
    .filter(([, positions]) => positions.length > 0)
    .map(([reason, positions]) => ({
      type: "CARDS_CAPTURED",
      player,
      positions,
      reason,
      moveNumber
    }));
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    board: state.board.map((cell) => (cell ? { ...cell, card: cloneCard(cell.card) } : null)),
    hands: {
      one: cloneCards(state.hands.one),
      two: cloneCards(state.hands.two)
    },
    scores: { ...state.scores },
    events: [...state.events]
  };
}

function cloneCards(cards: CardInstance[]): CardInstance[] {
  return cards.map(cloneCard);
}

function cloneCard(card: CardInstance): CardInstance {
  return {
    ...card,
    template: {
      ...card.template,
      sides: { ...card.template.sides },
      palette: { ...card.template.palette }
    }
  };
}
