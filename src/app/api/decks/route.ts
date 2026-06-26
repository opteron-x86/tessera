import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredUserId } from "@/lib/auth";
import { ensurePlayerBootstrap, getPlayerSnapshot, saveDeck } from "@/lib/economy";
import { jsonError } from "@/lib/http";

const deckSchema = z.object({
  deckId: z.string().optional(),
  name: z.string().min(1).max(48),
  cardIds: z.array(z.string()).length(5)
});

export async function POST(request: Request) {
  try {
    const userId = await getRequiredUserId();
    await ensurePlayerBootstrap(userId);
    const input = deckSchema.parse(await request.json());
    await saveDeck(userId, input);
    return NextResponse.json(await getPlayerSnapshot(userId));
  } catch (error) {
    return jsonError(error, error instanceof Error && error.message === "Unauthorized" ? 401 : 400);
  }
}
