import { Prisma, type PrismaClient } from "@prisma/client";
import {
  BOOSTER_PACKS,
  CARD_TEMPLATES,
  PVE_OPPONENTS,
  STARTER_CARD_IDS,
  getCardsByRarity
} from "../game/content";
import { chooseWeighted, createRng } from "../game/rng";
import { transmuteValue } from "../game/transmute";
import type { CardRarity, GameState } from "../game/types";
import { prisma } from "./db";

type Db = PrismaClient | Prisma.TransactionClient;

const RARITY_WEIGHTS: Record<CardRarity, number> = {
  COMMON: 100,
  UNCOMMON: 46,
  RARE: 18,
  EPIC: 6,
  LEGENDARY: 2
};

export function getPveOpponent(opponentId: string) {
  const opponent = PVE_OPPONENTS.find((candidate) => candidate.id === opponentId);
  if (!opponent) {
    throw new Error("Unknown PvE opponent.");
  }

  return opponent;
}

export async function ensureCatalog(db: Db = prisma) {
  await Promise.all(
    CARD_TEMPLATES.map((template) =>
      db.cardTemplate.upsert({
        where: { id: template.id },
        update: {
          name: template.name,
          series: template.series,
          collectorNumber: template.collectorNumber,
          rarity: template.rarity,
          tier: template.tier,
          affinity: template.affinity,
          sides: template.sides,
          lore: template.lore,
          artUrl: template.artUrl,
          palette: template.palette,
          isStarter: STARTER_CARD_IDS.includes(template.id),
          isPublished: true
        },
        create: {
          id: template.id,
          name: template.name,
          series: template.series,
          collectorNumber: template.collectorNumber,
          rarity: template.rarity,
          tier: template.tier,
          affinity: template.affinity,
          sides: template.sides,
          lore: template.lore,
          artUrl: template.artUrl,
          palette: template.palette,
          isStarter: STARTER_CARD_IDS.includes(template.id),
          isPublished: true
        }
      })
    )
  );

  await Promise.all(
    BOOSTER_PACKS.map((pack) =>
      db.boosterPack.upsert({
        where: { id: pack.id },
        update: {
          name: pack.name,
          price: pack.price,
          description: pack.description,
          slots: pack.slots,
          isActive: true
        },
        create: {
          id: pack.id,
          name: pack.name,
          price: pack.price,
          description: pack.description,
          slots: pack.slots,
          isActive: true
        }
      })
    )
  );

  await Promise.all(
    PVE_OPPONENTS.map((opponent) =>
      db.pveOpponent.upsert({
        where: { id: opponent.id },
        update: {
          name: opponent.name,
          difficulty: opponent.difficulty,
          deckTemplateIds: opponent.deckTemplateIds,
          ruleSet: opponent.ruleSet,
          rewardCurrency: opponent.rewardCurrency,
          tutorialCopy: opponent.tutorialCopy,
          unlockAfterId: opponent.unlockAfterId
        },
        create: {
          id: opponent.id,
          name: opponent.name,
          difficulty: opponent.difficulty,
          deckTemplateIds: opponent.deckTemplateIds,
          ruleSet: opponent.ruleSet,
          rewardCurrency: opponent.rewardCurrency,
          tutorialCopy: opponent.tutorialCopy,
          unlockAfterId: opponent.unlockAfterId
        }
      })
    )
  );
}

export async function ensurePlayerBootstrap(userId: string) {
  await prisma.$transaction(async (tx) => {
    await ensureCatalog(tx);

    await tx.playerProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        currency: 500,
        deckSlots: 3
      }
    });

    const ownedCount = await tx.cardInstance.count({ where: { ownerId: userId } });
    if (ownedCount > 0) {
      return;
    }

    const starterCards = await Promise.all(
      STARTER_CARD_IDS.map((templateId) =>
        tx.cardInstance.create({
          data: {
            ownerId: userId,
            templateId
          }
        })
      )
    );

    const deck = await tx.deck.create({
      data: {
        ownerId: userId,
        name: "First Road",
        isActive: true
      }
    });

    await Promise.all(
      starterCards.map((card, position) =>
        tx.deckCard.create({
          data: {
            deckId: deck.id,
            cardId: card.id,
            position
          }
        })
      )
    );

    await tx.currencyLedger.create({
      data: {
        userId,
        amount: 500,
        reason: "ADMIN_GRANT",
        metadata: {
          source: "starter_bootstrap"
        }
      }
    });
  });

  return getPlayerSnapshot(userId);
}

export async function getPlayerSnapshot(userId: string) {
  const [profile, cards, decks, pveProgress, templates, packs, opponents] =
    await Promise.all([
      prisma.playerProfile.findUniqueOrThrow({ where: { userId } }),
      prisma.cardInstance.findMany({
        where: { ownerId: userId },
        include: { template: true },
        orderBy: { createdAt: "asc" }
      }),
      prisma.deck.findMany({
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
        orderBy: { createdAt: "asc" }
      }),
      prisma.pveProgress.findMany({ where: { userId } }),
      prisma.cardTemplate.findMany({ orderBy: [{ series: "asc" }, { tier: "asc" }, { name: "asc" }] }),
      prisma.boosterPack.findMany({ where: { isActive: true }, orderBy: { price: "asc" } }),
      prisma.pveOpponent.findMany({ orderBy: { difficulty: "asc" } })
    ]);

  return {
    profile,
    cards,
    decks,
    pveProgress,
    templates,
    packs,
    opponents
  };
}

export async function assertPveOpponentUnlocked(userId: string, opponentId: string) {
  const opponent = getPveOpponent(opponentId);
  if (!opponent.unlockAfterId) {
    return opponent;
  }

  const requiredProgress = await prisma.pveProgress.findUnique({
    where: {
      userId_opponentId: {
        userId,
        opponentId: opponent.unlockAfterId
      }
    }
  });

  if (!requiredProgress?.completedAt) {
    throw new Error("Beat the previous PvE opponent to unlock this challenge.");
  }

  return opponent;
}

export async function saveDeck(userId: string, input: { deckId?: string; name: string; cardIds: string[] }) {
  if (input.cardIds.length !== 5) {
    throw new Error("A deck must contain exactly 5 cards.");
  }

  if (new Set(input.cardIds).size !== input.cardIds.length) {
    throw new Error("A deck cannot contain duplicate owned cards.");
  }

  return prisma.$transaction(async (tx) => {
    const profile = await tx.playerProfile.findUniqueOrThrow({ where: { userId } });
    const ownedCards = await tx.cardInstance.findMany({
      where: {
        ownerId: userId,
        id: { in: input.cardIds }
      }
    });

    if (ownedCards.length !== input.cardIds.length) {
      throw new Error("Every deck card must be owned by the player.");
    }

    const existingDeckCount = await tx.deck.count({ where: { ownerId: userId } });
    if (!input.deckId && existingDeckCount >= profile.deckSlots) {
      throw new Error("No deck slots are available.");
    }

    let deck;
    if (input.deckId) {
      const existing = await tx.deck.findFirst({
        where: {
          id: input.deckId,
          ownerId: userId
        }
      });
      if (!existing) {
        throw new Error("Deck not found.");
      }

      deck = await tx.deck.update({
        where: { id: input.deckId },
        data: { name: input.name }
      });
    } else {
      deck = await tx.deck.create({
        data: {
          ownerId: userId,
          name: input.name,
          isActive: existingDeckCount === 0
        }
      });
    }

    await tx.deckCard.deleteMany({ where: { deckId: deck.id } });
    await Promise.all(
      input.cardIds.map((cardId, position) =>
        tx.deckCard.create({
          data: {
            deckId: deck.id,
            cardId,
            position
          }
        })
      )
    );

    return deck;
  });
}

export async function openBooster(userId: string, packId: string) {
  const pack = BOOSTER_PACKS.find((candidate) => candidate.id === packId);
  if (!pack) {
    throw new Error("Unknown booster pack.");
  }

  const seed = `${userId}:${packId}:${Date.now()}`;
  const rng = createRng(seed);

  return prisma.$transaction(async (tx) => {
    const profile = await tx.playerProfile.findUniqueOrThrow({ where: { userId } });
    if (profile.currency < pack.price) {
      throw new Error("Not enough currency.");
    }

    const templates = pack.slots.flatMap((slot) =>
      Array.from({ length: slot.count }, () => {
        let rarity = slot.rarity;
        if (slot.chanceUpgrades) {
          for (const [upgradeRarity, chance] of Object.entries(slot.chanceUpgrades) as Array<
            [CardRarity, number]
          >) {
            if (rng() <= chance) {
              rarity = upgradeRarity;
            }
          }
        }

        const choices = getCardsByRarity(rarity);
        return chooseWeighted(
          choices.map((card) => ({
            value: card,
            weight: RARITY_WEIGHTS[card.rarity]
          })),
          rng
        );
      })
    );

    await tx.playerProfile.update({
      where: { userId },
      data: { currency: { decrement: pack.price } }
    });

    await tx.currencyLedger.create({
      data: {
        userId,
        amount: -pack.price,
        reason: "BOOSTER_PURCHASE",
        metadata: { packId }
      }
    });

    const created = await Promise.all(
      templates.map((template) =>
        tx.cardInstance.create({
          data: {
            ownerId: userId,
            templateId: template.id
          },
          include: {
            template: true
          }
        })
      )
    );

    return {
      pack,
      cards: created
    };
  });
}

export async function transmuteCard(userId: string, cardId: string) {
  return prisma.$transaction(async (tx) => {
    const card = await tx.cardInstance.findFirstOrThrow({
      where: { id: cardId, ownerId: userId },
      include: {
        template: true,
        deckPositions: true
      }
    });

    if (card.isLocked || card.deckPositions.length > 0) {
      throw new Error("Cards in decks or locked cards cannot be transmuted.");
    }

    const amount = transmuteValue(card.template.rarity as CardRarity, card.upgradeLevel);

    await tx.cardInstance.delete({ where: { id: card.id } });
    await tx.playerProfile.update({
      where: { userId },
      data: { currency: { increment: amount } }
    });
    await tx.currencyLedger.create({
      data: {
        userId,
        amount,
        reason: "CARD_TRANSMUTE",
        metadata: {
          cardId,
          templateId: card.templateId
        }
      }
    });

    return {
      amount,
      template: card.template
    };
  });
}

export async function awardMatchReward(args: {
  userId: string;
  matchId: string;
  won: boolean;
  draw?: boolean;
}) {
  const amount = args.draw ? 50 : args.won ? 100 : 35;

  await prisma.$transaction(async (tx) => {
    const existingRewards = await tx.currencyLedger.findMany({
      where: {
        userId: args.userId,
        reason: "MATCH_REWARD"
      }
    });
    const existing = existingRewards.some((reward) => {
      const metadata = reward.metadata as { matchId?: string } | null;
      return metadata?.matchId === args.matchId;
    });

    if (existing) {
      return;
    }

    await tx.playerProfile.update({
      where: { userId: args.userId },
      data: { currency: { increment: amount } }
    });
    await tx.currencyLedger.create({
      data: {
        userId: args.userId,
        amount,
        reason: "MATCH_REWARD",
        metadata: {
          matchId: args.matchId,
          won: args.won,
          draw: args.draw ?? false
        }
      }
    });
  });

  return amount;
}

export async function completePveMatchReward(args: {
  userId: string;
  matchId: string;
  opponentId: string;
  state: GameState;
}) {
  const opponent = getPveOpponent(args.opponentId);
  const won = args.state.winner === "one";
  const draw = args.state.winner === "draw";
  const amount = won
    ? opponent.rewardCurrency
    : draw
      ? Math.max(20, Math.floor(opponent.rewardCurrency * 0.5))
      : Math.max(15, Math.floor(opponent.rewardCurrency * 0.25));
  const score = args.state.scores.one;

  return prisma.$transaction(async (tx) => {
    const existingRewards = await tx.currencyLedger.findMany({
      where: {
        userId: args.userId,
        reason: "MATCH_REWARD"
      }
    });
    const existing = existingRewards.find((reward) => {
      const metadata = reward.metadata as { matchId?: string } | null;
      return metadata?.matchId === args.matchId;
    });

    if (existing) {
      return {
        amount: existing.amount,
        awarded: false,
        won,
        draw
      };
    }

    const currentProgress = await tx.pveProgress.findUnique({
      where: {
        userId_opponentId: {
          userId: args.userId,
          opponentId: args.opponentId
        }
      }
    });
    const bestScore = Math.max(currentProgress?.bestScore ?? 0, score);
    const completionDate = new Date();

    await tx.pveProgress.upsert({
      where: {
        userId_opponentId: {
          userId: args.userId,
          opponentId: args.opponentId
        }
      },
      create: {
        userId: args.userId,
        opponentId: args.opponentId,
        wins: won ? 1 : 0,
        bestScore,
        completedAt: won ? completionDate : null
      },
      update: {
        bestScore,
        ...(won
          ? {
              wins: { increment: 1 },
              completedAt: currentProgress?.completedAt ?? completionDate
            }
          : {})
      }
    });

    await tx.playerProfile.update({
      where: { userId: args.userId },
      data: { currency: { increment: amount } }
    });
    await tx.currencyLedger.create({
      data: {
        userId: args.userId,
        amount,
        reason: "MATCH_REWARD",
        metadata: {
          mode: "PVE",
          matchId: args.matchId,
          opponentId: args.opponentId,
          won,
          draw,
          score
        }
      }
    });

    return {
      amount,
      awarded: true,
      won,
      draw
    };
  });
}
