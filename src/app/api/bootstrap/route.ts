import { NextResponse } from "next/server";
import { getRequiredUserId } from "@/lib/auth";
import { ensurePlayerBootstrap } from "@/lib/economy";
import { jsonError } from "@/lib/http";

export async function GET() {
  try {
    const userId = await getRequiredUserId();
    const snapshot = await ensurePlayerBootstrap(userId);
    return NextResponse.json(snapshot);
  } catch (error) {
    return jsonError(error, error instanceof Error && error.message === "Unauthorized" ? 401 : 400);
  }
}
