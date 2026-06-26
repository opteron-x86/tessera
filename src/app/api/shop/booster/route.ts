import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredUserId } from "@/lib/auth";
import { ensurePlayerBootstrap, getPlayerSnapshot, openBooster } from "@/lib/economy";
import { jsonError } from "@/lib/http";

const boosterSchema = z.object({
  packId: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const userId = await getRequiredUserId();
    await ensurePlayerBootstrap(userId);
    const { packId } = boosterSchema.parse(await request.json());
    const opened = await openBooster(userId, packId);
    return NextResponse.json({
      opened,
      snapshot: await getPlayerSnapshot(userId)
    });
  } catch (error) {
    return jsonError(error, error instanceof Error && error.message === "Unauthorized" ? 401 : 400);
  }
}
