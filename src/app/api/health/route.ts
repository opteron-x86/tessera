import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  // Stays ok without a database: guest PvE works standalone, and the deploy
  // healthcheck must not flap while Postgres is provisioning.
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }

  return NextResponse.json({
    ok: true,
    service: "tessera",
    db,
    time: new Date().toISOString()
  });
}
