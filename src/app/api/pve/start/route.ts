import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { makeWeightedAiDeck, resolvePveOpponentRules } from "@/game/content";
import { createGame } from "@/game/engine";
import { getRequiredUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertPveOpponentUnlocked, ensurePlayerBootstrap } from "@/lib/economy";
import { jsonError } from "@/lib/http";
import { toGameDeck } from "@/lib/mappers";

const pveStartSchema = z.object({
  opponentId: z.string().default("old-road-tutor")
});

export async function POST(request: Request) {
  try {
    const userId = await getRequiredUserId();
    await ensurePlayerBootstrap(userId);
    const { opponentId } = pveStartSchema.parse(await request.json());
    const opponent = await assertPveOpponentUnlocked(userId, opponentId);

    const deck = await prisma.deck.findFirst({
      where: { ownerId: userId },
      include: {
        cards: {
          include: {
            card: {
              include: {
                template: true
              }
            }
          },
          orderBy: { position: "asc" }
        }
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }]
    });

    if (!deck) {
      throw new Error("Create a deck before starting a PvE match.");
    }

    const matchId = randomUUID();
    const ruleSet = resolvePveOpponentRules(opponent, matchId);
    const game = createGame({
      id: matchId,
      seed: matchId,
      rules: ruleSet,
      playerOneDeck: toGameDeck(deck),
      playerTwoDeck: makeWeightedAiDeck(
        `${opponent.id}-deck`,
        "pve",
        opponent.name,
        matchId,
        opponent.difficulty,
        opponent.deckAffinity
      )
    });

    await prisma.match.create({
      data: {
        id: matchId,
        mode: "PVE",
        phase: "ACTIVE",
        playerOneId: userId,
        opponentId: opponent.id,
        ruleSet,
        seed: matchId,
        state: game
      }
    });

    return NextResponse.json({
      matchId,
      opponent,
      game
    });
  } catch (error) {
    return jsonError(error, error instanceof Error && error.message === "Unauthorized" ? 401 : 400);
  }
}
