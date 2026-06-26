import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredUserId } from "@/lib/auth";
import { ensurePlayerBootstrap, getPlayerSnapshot, transmuteCard } from "@/lib/economy";
import { jsonError } from "@/lib/http";

const transmuteSchema = z.object({
  cardId: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const userId = await getRequiredUserId();
    await ensurePlayerBootstrap(userId);
    const { cardId } = transmuteSchema.parse(await request.json());
    const transmutation = await transmuteCard(userId, cardId);
    return NextResponse.json({
      transmutation,
      snapshot: await getPlayerSnapshot(userId)
    });
  } catch (error) {
    return jsonError(error, error instanceof Error && error.message === "Unauthorized" ? 401 : 400);
  }
}
