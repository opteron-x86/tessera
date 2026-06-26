import {
  applyCommand,
  effectiveSidesForCard,
  effectiveSidesForCell,
  emptyPositions,
  otherPlayer
} from "./engine";
import { createRng } from "./rng";
import type {
  AiTier,
  BoardCell,
  CaptureReason,
  CardInstance,
  GameState,
  PlayCardCommand,
  PlayerSlot,
  Sides
} from "./types";

type Direction = "top" | "right" | "bottom" | "left";

type AiProfile = {
  tier: AiTier;
  depth: number;
  endgameExactAt: number;
  candidateLimit: number;
  noise: number;
  mistakeRate: number;
  cardConservation: number;
  vulnerabilityAwareness: number;
};

type AiOptions = {
  tier?: AiTier;
};

const DIRECTIONS: Array<{
  side: Direction;
  opposite: Direction;
  offset: number;
  allowed: (index: number) => boolean;
}> = [
  { side: "top", opposite: "bottom", offset: -3, allowed: (index) => index > 2 },
  { side: "right", opposite: "left", offset: 1, allowed: (index) => index % 3 !== 2 },
  { side: "bottom", opposite: "top", offset: 3, allowed: (index) => index < 6 },
  { side: "left", opposite: "right", offset: -1, allowed: (index) => index % 3 !== 0 }
];

const CAPTURE_WEIGHT: Record<CaptureReason, number> = {
  normal: 42,
  same: 72,
  plus: 78,
  combo: 95
};

const AI_PROFILES: Record<AiTier, AiProfile> = {
  beginner: {
    tier: "beginner",
    depth: 1,
    endgameExactAt: 0,
    candidateLimit: 99,
    noise: 95,
    mistakeRate: 0.38,
    cardConservation: 0.15,
    vulnerabilityAwareness: 0.15
  },
  standard: {
    tier: "standard",
    depth: 1,
    endgameExactAt: 0,
    candidateLimit: 99,
    noise: 8,
    mistakeRate: 0,
    cardConservation: 0.9,
    vulnerabilityAwareness: 0.9
  },
  expert: {
    tier: "expert",
    depth: 2,
    endgameExactAt: 4,
    candidateLimit: 12,
    noise: 1.5,
    mistakeRate: 0,
    cardConservation: 1.05,
    vulnerabilityAwareness: 1.15
  },
  master: {
    tier: "master",
    depth: 4,
    endgameExactAt: 5,
    candidateLimit: 14,
    noise: 0.25,
    mistakeRate: 0,
    cardConservation: 1.2,
    vulnerabilityAwareness: 1.35
  }
};

export function chooseAiMove(state: GameState, options: AiOptions = {}): PlayCardCommand {
  const profile = AI_PROFILES[options.tier ?? "standard"];
  const perspective = state.currentPlayer;
  const rng = createRng(`${state.seed}:${state.moveNumber}:${perspective}:${profile.tier}`);
  const moves = orderedMoves(state, perspective, profile, Number.POSITIVE_INFINITY);

  if (moves.length === 0) {
    throw new Error("No legal AI moves are available.");
  }

  if (profile.tier === "beginner") {
    return chooseBeginnerMove(moves, rng, profile);
  }

  if (profile.tier === "standard") {
    return bestByHeuristic(moves, rng, profile);
  }

  return bestBySearch(state, perspective, moves, rng, profile);
}

function chooseBeginnerMove(
  moves: Array<{ move: PlayCardCommand; value: number }>,
  rng: () => number,
  profile: AiProfile
) {
  if (rng() < profile.mistakeRate) {
    const start = Math.floor(moves.length * 0.35);
    const span = Math.max(1, moves.length - start);
    return moves[start + Math.floor(rng() * span)]!.move;
  }

  const poolSize = Math.max(1, Math.ceil(moves.length * 0.35));
  return moves[Math.floor(rng() * poolSize)]!.move;
}

function bestByHeuristic(
  moves: Array<{ move: PlayCardCommand; value: number }>,
  rng: () => number,
  profile: AiProfile
) {
  let best = moves[0]!.move;
  let bestValue = Number.NEGATIVE_INFINITY;

  for (const candidate of moves) {
    const value = candidate.value + rng() * profile.noise;
    if (value > bestValue) {
      best = candidate.move;
      bestValue = value;
    }
  }

  return best;
}

function bestBySearch(
  state: GameState,
  perspective: PlayerSlot,
  moves: Array<{ move: PlayCardCommand; value: number }>,
  rng: () => number,
  profile: AiProfile
) {
  const depth = searchDepth(state, profile);
  const cache = new Map<string, number>();
  let best = moves[0]!.move;
  let bestValue = Number.NEGATIVE_INFINITY;

  for (const candidate of moves) {
    const projected = applyCommand(state, candidate.move);
    const value =
      minimax(projected, perspective, depth - 1, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, profile, cache) +
      candidate.value * 0.08 +
      rng() * profile.noise;

    if (value > bestValue) {
      best = candidate.move;
      bestValue = value;
    }
  }

  return best;
}

function minimax(
  state: GameState,
  perspective: PlayerSlot,
  depth: number,
  alpha: number,
  beta: number,
  profile: AiProfile,
  cache: Map<string, number>
): number {
  if (depth <= 0 || state.phase === "complete") {
    return evaluateState(state, perspective);
  }

  const key = stateKey(state, perspective, depth);
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const maximizing = state.currentPlayer === perspective;
  const remaining = emptyPositions(state).length;
  const limit = remaining <= profile.endgameExactAt ? Number.POSITIVE_INFINITY : profile.candidateLimit;
  const moves = orderedMoves(state, perspective, profile, limit);

  if (moves.length === 0) {
    return evaluateState(state, perspective);
  }

  let value = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

  for (const candidate of moves) {
    const projected = applyCommand(state, candidate.move);
    const next = minimax(projected, perspective, depth - 1, alpha, beta, profile, cache);

    if (maximizing) {
      value = Math.max(value, next);
      alpha = Math.max(alpha, value);
    } else {
      value = Math.min(value, next);
      beta = Math.min(beta, value);
    }

    if (beta <= alpha) {
      break;
    }
  }

  cache.set(key, value);
  return value;
}

function searchDepth(state: GameState, profile: AiProfile) {
  const remaining = emptyPositions(state).length;

  if (profile.tier === "expert") {
    if (state.rules.open && remaining <= profile.endgameExactAt) {
      return remaining;
    }
    return state.rules.open ? profile.depth : 1;
  }

  if (profile.tier === "master") {
    if (remaining <= profile.endgameExactAt) {
      return remaining;
    }
    return state.rules.open ? profile.depth : Math.max(2, profile.depth - 1);
  }

  return profile.depth;
}

function orderedMoves(
  state: GameState,
  perspective: PlayerSlot,
  profile: AiProfile,
  limit: number
): Array<{ move: PlayCardCommand; value: number }> {
  const maximizing = state.currentPlayer === perspective;
  const moves = legalMoves(state);
  const scored = moves
    .map((move) => ({
      move,
      value: tacticalMoveScore(state, move, perspective, profile)
    }))
    .sort((left, right) =>
      maximizing ? right.value - left.value : left.value - right.value
    );

  return scored.slice(0, limit);
}

function legalMoves(state: GameState): PlayCardCommand[] {
  const player = state.currentPlayer;
  const positions = emptyPositions(state);
  return state.hands[player].flatMap((card) =>
    positions.map((position) => ({
      type: "PLAY_CARD" as const,
      player,
      cardId: card.id,
      position
    }))
  );
}

function tacticalMoveScore(
  state: GameState,
  move: PlayCardCommand,
  perspective: PlayerSlot,
  profile: AiProfile
) {
  const before = scoreDiff(state, perspective);
  const projected = applyCommand(state, move);
  const after = scoreDiff(projected, perspective);
  const sign = move.player === perspective ? 1 : -1;
  const card = state.hands[move.player].find((candidate) => candidate.id === move.cardId);
  const captures = captureBonus(projected, state.events.length);

  return (
    evaluateState(projected, perspective) +
    (after - before) * 55 +
    captures * sign +
    (card ? placementValue(card, move.position, projected.board, move.player, projected.rules) * sign : 0) +
    ruleSetupValue(state, move, profile) * sign -
    (card ? cardCommitmentPenalty(state, card, captures, profile) * sign : 0) -
    vulnerabilityPenalty(projected, move.position, move.player, profile) * sign
  );
}

function evaluateState(state: GameState, perspective: PlayerSlot): number {
  if (state.phase === "complete") {
    if (state.winner === perspective) return 100000 + scoreDiff(state, perspective) * 100;
    if (state.winner === "draw") return scoreDiff(state, perspective) * 100;
    return -100000 + scoreDiff(state, perspective) * 100;
  }

  const opponent = otherPlayer(perspective);
  let value = scoreDiff(state, perspective) * 135;
  value += handPower(state.hands[perspective]) * 1.5;
  value -= handPower(state.hands[opponent]) * 1.5;

  for (const cell of state.board) {
    if (!cell) continue;
    value += (cell.owner === perspective ? 1 : -1) * boardCellValue(cell, state);
  }

  if (state.currentPlayer === perspective) {
    value += 8;
  }

  return value;
}

function captureBonus(state: GameState, previousEventCount: number) {
  return state.events.slice(previousEventCount).reduce((sum, event) => {
    if (event.type !== "CARDS_CAPTURED") {
      return sum;
    }

    return sum + event.positions.length * CAPTURE_WEIGHT[event.reason];
  }, 0);
}

function ruleSetupValue(state: GameState, move: PlayCardCommand, profile: AiProfile) {
  if (profile.tier === "beginner" || (!state.rules.same && !state.rules.plus)) {
    return 0;
  }

  const card = state.hands[move.player].find((candidate) => candidate.id === move.cardId);
  if (!card) {
    return 0;
  }

  const adjacent = adjacentCells(state.board, move.position);
  const projectedBoard = state.board.map((cell, index) =>
    index === move.position ? { index, owner: move.player, card } : cell
  );
  const sourceSides = effectiveSidesForCard(card, state.rules, projectedBoard);
  let value = 0;

  if (state.rules.same) {
    const sameMatches = adjacent.filter(
      ({ direction, cell }) => {
        if (cell.owner === move.player) {
          return false;
        }

        const cellSides = effectiveSidesForCell(cell, state.rules, projectedBoard);
        return sourceSides[direction.side] === cellSides[direction.opposite];
      }
    ).length;
    value += sameMatches >= 2 ? 34 : sameMatches * 5;
  }

  if (state.rules.plus) {
    const sums = new Map<number, number>();
    for (const { direction, cell } of adjacent) {
      if (cell.owner === move.player) {
        continue;
      }

      const cellSides = effectiveSidesForCell(cell, state.rules, projectedBoard);
      const sum =
        sourceSides[direction.side] +
        cellSides[direction.opposite];
      sums.set(sum, (sums.get(sum) ?? 0) + 1);
    }
    value += [...sums.values()].some((count) => count >= 2) ? 38 : 0;
  }

  if (state.rules.combo) {
    value *= 1.15;
  }

  return value;
}

function boardCellValue(cell: BoardCell, state: GameState) {
  const sides = effectiveSidesForCell(cell, state.rules, state.board);
  return (
    placementValueForSides(sides, cell.index, state.board, cell.owner) +
    cardPowerFromSides(sides) * 0.7
  );
}

function placementValue(
  card: CardInstance,
  position: number,
  board: Array<BoardCell | null>,
  owner: PlayerSlot,
  rules?: GameState["rules"]
) {
  const sides = rules ? effectiveSidesForCard(card, rules, board) : card.template.sides;
  return placementValueForSides(sides, position, board, owner);
}

function placementValueForSides(
  sides: Sides,
  position: number,
  board: Array<BoardCell | null>,
  owner: PlayerSlot
) {
  let value = positionBaseValue(position);

  for (const direction of DIRECTIONS) {
    const side = sides[direction.side];
    if (!direction.allowed(position)) {
      value += side <= 4 ? (5 - side) * 3 : -(side - 5) * 2.15;
      continue;
    }

    const neighbor = board[position + direction.offset];
    if (!neighbor) {
      value += side * 1.05 - Math.max(0, 5 - side) * 1.7;
    } else {
      value += side * (neighbor.owner === owner ? 0.18 : 0.62);
    }
  }

  value += exposedPairBonus(sides, position);
  return value;
}

function positionBaseValue(position: number) {
  if ([0, 2, 6, 8].includes(position)) return 14;
  if (position === 4) return 8;
  return 10;
}

function exposedPairBonus(sides: Sides, position: number) {
  const exposed = DIRECTIONS.filter((direction) => direction.allowed(position)).map(
    (direction) => direction.side
  );
  const pairs: Array<[Direction, Direction]> = [
    ["top", "right"],
    ["right", "bottom"],
    ["bottom", "left"],
    ["left", "top"]
  ];

  return pairs.reduce((best, [left, right]) => {
    if (!exposed.includes(left) || !exposed.includes(right)) {
      return best;
    }

    const pair = sides[left] + sides[right];
    return Math.max(best, pair >= 12 ? (pair - 10) * 1.35 : 0);
  }, 0);
}

function cardCommitmentPenalty(
  state: GameState,
  card: CardInstance,
  captureValue: number,
  profile: AiProfile
) {
  if (profile.cardConservation <= 0) {
    return 0;
  }

  const remaining = emptyPositions(state).length;
  const earlyGame = remaining / 9;
  const premiumPower = Math.max(0, cardPower(card) - 18);
  const premiumTier = card.template.tier >= 7 ? card.template.tier * 2.2 : card.template.tier * 0.8;
  const captureRelief = captureValue * 0.22;

  return Math.max(0, (premiumPower + premiumTier) * earlyGame * 2.2 - captureRelief) * profile.cardConservation;
}

function vulnerabilityPenalty(
  state: GameState,
  position: number,
  owner: PlayerSlot,
  profile: AiProfile
) {
  if (profile.vulnerabilityAwareness <= 0 || !state.rules.open) {
    return 0;
  }

  const cell = state.board[position];
  if (!cell) {
    return 0;
  }

  const opponent = otherPlayer(owner);
  const opponentHand = state.hands[opponent];
  let penalty = 0;

  for (const direction of DIRECTIONS) {
    if (!direction.allowed(position)) {
      continue;
    }

    const neighborIndex = position + direction.offset;
    if (state.board[neighborIndex]) {
      continue;
    }

    const defense = effectiveSidesForCell(cell, state.rules, state.board)[direction.side];
    const bestAttack = opponentHand.reduce(
      (best, card) => Math.max(best, card.template.sides[direction.opposite]),
      0
    );

    if (bestAttack > defense) {
      penalty += (bestAttack - defense) * (8 + cardPower(cell.card) * 0.45);
    } else if (defense <= 4) {
      penalty += (5 - defense) * 3;
    }
  }

  return penalty * profile.vulnerabilityAwareness;
}

function adjacentCells(board: Array<BoardCell | null>, position: number) {
  return DIRECTIONS.flatMap((direction) => {
    if (!direction.allowed(position)) {
      return [];
    }

    const cell = board[position + direction.offset];
    return cell ? [{ direction, cell }] : [];
  });
}

function scoreDiff(state: GameState, perspective: PlayerSlot) {
  return state.scores[perspective] - state.scores[otherPlayer(perspective)];
}

function handPower(cards: CardInstance[]) {
  return cards.reduce((sum, card) => sum + cardPower(card), 0);
}

function cardPower(card: CardInstance) {
  return cardPowerFromSides(card.template.sides);
}

function cardPowerFromSides(sides: Sides) {
  return sides.top + sides.right + sides.bottom + sides.left;
}

function stateKey(state: GameState, perspective: PlayerSlot, depth: number) {
  const board = state.board
    .map((cell) => (cell ? `${cell.owner}:${cell.card.id}` : "_"))
    .join(",");
  const hands = `${state.hands.one.map((card) => card.id).join(".")}|${state.hands.two
    .map((card) => card.id)
    .join(".")}`;
  return `${perspective}:${depth}:${state.currentPlayer}:${state.phase}:${board}:${hands}`;
}
