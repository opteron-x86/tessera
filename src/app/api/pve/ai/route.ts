import { NextResponse } from "next/server";
import { z } from "zod";
import { chooseAiMove } from "@/game/ai";
import { applyCommand } from "@/game/engine";
import type { GameState, MatchEvent } from "@/game/types";
import { getRequiredUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  completePveMatchReward,
  ensurePlayerBootstrap,
  getPveOpponent,
  getPlayerSnapshot
} from "@/lib/economy";
import { jsonError } from "@/lib/http";

const pveAiSchema = z.object({
  matchId: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const userId = await getRequiredUserId();
    await ensurePlayerBootstrap(userId);
    const { matchId } = pveAiSchema.parse(await request.json());

    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        mode: "PVE",
        playerOneId: userId
      }
    });

    if (!match) {
      throw new Error("PvE match not found.");
    }
    if (match.phase !== "ACTIVE") {
      throw new Error("This PvE match is already complete.");
    }
    if (!match.opponentId) {
      throw new Error("PvE opponent is missing from the match.");
    }

    const opponent = getPveOpponent(match.opponentId);
    const previousState = match.state as unknown as GameState;
    if (previousState.currentPlayer !== "two") {
      throw new Error("It is not the AI opponent's turn.");
    }

    const previousEventCount = previousState.events.length;
    const nextState = applyCommand(previousState, chooseAiMove(previousState, { tier: opponent.aiTier }));

    const reward =
      nextState.phase === "complete"
        ? await completePveMatchReward({
            userId,
            matchId,
            opponentId: match.opponentId,
            state: nextState
          })
        : null;

    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId },
        data: {
          phase: nextState.phase === "complete" ? "COMPLETE" : "ACTIVE",
          state: nextState,
          winnerId: nextState.winner === "one" ? userId : null,
          completedAt: nextState.phase === "complete" ? new Date() : null
        }
      });

      const newEvents = nextState.events.slice(previousEventCount);
      if (newEvents.length > 0) {
        await tx.matchEvent.createMany({
          data: newEvents.map((event, index) => ({
            matchId,
            sequence: previousEventCount + index + 1,
            actorId: actorIdForEvent(event, userId),
            eventType: event.type,
            payload: event
          })),
          skipDuplicates: true
        });
      }
    });

    return NextResponse.json({
      game: nextState,
      reward,
      snapshot: reward ? await getPlayerSnapshot(userId) : null
    });
  } catch (error) {
    return jsonError(error, error instanceof Error && error.message === "Unauthorized" ? 401 : 400);
  }
}

function actorIdForEvent(event: MatchEvent, userId: string) {
  return "player" in event && event.player === "one" ? userId : null;
}
