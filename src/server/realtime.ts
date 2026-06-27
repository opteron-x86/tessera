import type { Server as HttpServer } from "node:http";
import { randomUUID } from "node:crypto";
import { Server } from "socket.io";
import { STARTER_CARD_IDS, SAME_PLUS_RULES, makeDeck } from "../game/content";
import { applyCommand, createGame } from "../game/engine";
import type { Deck, GameState, MatchCommand, PlayerSlot } from "../game/types";
import { prisma } from "../lib/db";
import { ensurePlayerBootstrap } from "../lib/economy";
import { toGameDeck } from "../lib/mappers";

type RoomPlayer = {
  socketId: string;
  userId: string;
  name: string;
  slot: PlayerSlot;
  deck: Deck;
};

type DuelRoom = {
  id: string;
  matchId: string;
  players: Partial<Record<PlayerSlot, RoomPlayer>>;
  state: GameState | null;
};

const rooms = new Map<string, DuelRoom>();

export function registerRealtimeServer(server: HttpServer) {
  const io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on(
      "pvp:create",
      async (
        payload: { userId?: string; name?: string },
        reply: (response: unknown) => void
      ) => {
        try {
          const userId = requireUserId(payload.userId);
          const roomId = createInviteCode();
          const room: DuelRoom = {
            id: roomId,
            matchId: randomUUID(),
            players: {
              one: {
                socketId: socket.id,
                userId,
                name: payload.name ?? "Host",
                slot: "one",
                deck: await loadPlayerDeck(userId, `${roomId}-one`, "Host Deck")
              }
            },
            state: null
          };
          rooms.set(roomId, room);
          socket.join(roomId);
          reply({ ok: true, roomId, slot: "one" });
          emitRoom(io, room);
        } catch (error) {
          reply({ ok: false, error: errorMessage(error) });
        }
      }
    );

    socket.on(
      "pvp:join",
      async (
        payload: { roomId?: string; userId?: string; name?: string },
        reply: (response: unknown) => void
      ) => {
        try {
          const userId = requireUserId(payload.userId);
          const room = rooms.get(normalizeRoomId(payload.roomId));
          if (!room) {
            throw new Error("Invite room not found.");
          }

          if (room.players.two) {
            throw new Error("Invite room is already full.");
          }

          room.players.two = {
            socketId: socket.id,
            userId,
            name: payload.name ?? "Challenger",
            slot: "two",
            deck: await loadPlayerDeck(userId, `${room.id}-two`, "Challenger Deck")
          };
          room.state = createGame({
            id: room.matchId,
            seed: room.matchId,
            rules: SAME_PLUS_RULES,
            playerOneDeck: room.players.one!.deck,
            playerTwoDeck: room.players.two.deck
          });

          socket.join(room.id);
          await persistRoom(room);
          reply({ ok: true, roomId: room.id, slot: "two", state: room.state });
          emitRoom(io, room);
        } catch (error) {
          reply({ ok: false, error: errorMessage(error) });
        }
      }
    );

    socket.on(
      "pvp:play",
      async (
        payload: { roomId?: string; command?: MatchCommand },
        reply: (response: unknown) => void
      ) => {
        try {
          const room = rooms.get(normalizeRoomId(payload.roomId));
          if (!room?.state || !payload.command) {
            throw new Error("Active match not found.");
          }

          const player = playerForSocket(room, socket.id);
          if (!player) {
            throw new Error("This socket is not a player in the room.");
          }

          if (payload.command.player !== player.slot) {
            throw new Error("Command player does not match the connected player.");
          }

          room.state = applyCommand(room.state, payload.command);
          await persistRoom(room);
          reply({ ok: true, state: room.state });
          emitRoom(io, room);
          if (room.state.phase === "complete") {
            closeRoom(io, room);
          }
        } catch (error) {
          reply({ ok: false, error: errorMessage(error) });
        }
      }
    );

    socket.on(
      "pvp:concede",
      async (
        payload: { roomId?: string; player?: PlayerSlot },
        reply: (response: unknown) => void
      ) => {
        try {
          const room = rooms.get(normalizeRoomId(payload.roomId));
          if (!room?.state || !payload.player) {
            throw new Error("Active match not found.");
          }

          const player = playerForSocket(room, socket.id);
          if (!player || player.slot !== payload.player) {
            throw new Error("Only the connected player can concede.");
          }

          room.state = applyCommand(room.state, {
            type: "CONCEDE",
            player: payload.player
          });
          await persistRoom(room);
          reply({ ok: true, state: room.state });
          emitRoom(io, room);
          closeRoom(io, room);
        } catch (error) {
          reply({ ok: false, error: errorMessage(error) });
        }
      }
    );

    socket.on(
      "pvp:close",
      async (payload: { roomId?: string }, reply: (response: unknown) => void) => {
        try {
          const room = rooms.get(normalizeRoomId(payload.roomId));
          if (!room) {
            reply({ ok: true });
            return;
          }

          const player = playerForSocket(room, socket.id);
          if (!player) {
            throw new Error("Only a room player can close the room.");
          }

          closeRoom(io, room);
          reply({ ok: true });
        } catch (error) {
          reply({ ok: false, error: errorMessage(error) });
        }
      }
    );

    socket.on("disconnect", () => {
      for (const room of rooms.values()) {
        const player = playerForSocket(room, socket.id);
        if (player) {
          io.to(room.id).emit("pvp:presence", {
            roomId: room.id,
            slot: player.slot,
            connected: false
          });
        }
      }
    });
  });

  return io;
}

function emitRoom(io: Server, room: DuelRoom) {
  io.to(room.id).emit("pvp:room", {
    roomId: room.id,
    players: {
      one: room.players.one
        ? { name: room.players.one.name, userId: room.players.one.userId }
        : null,
      two: room.players.two
        ? { name: room.players.two.name, userId: room.players.two.userId }
        : null
    },
    state: room.state
  });
}

function closeRoom(io: Server, room: DuelRoom) {
  rooms.delete(room.id);
  io.to(room.id).emit("pvp:closed", { roomId: room.id });
  io.in(room.id).socketsLeave(room.id);
}

async function loadPlayerDeck(userId: string, fallbackId: string, fallbackName: string): Promise<Deck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!user) {
    return makeDeck(fallbackId, userId, fallbackName, STARTER_CARD_IDS);
  }

  await ensurePlayerBootstrap(userId);
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
    throw new Error("Save a deck before starting a PvP match.");
  }

  return toGameDeck(deck);
}

async function persistRoom(room: DuelRoom) {
  if (!room.state || !room.players.one) {
    return;
  }

  try {
    await prisma.match.upsert({
      where: { id: room.matchId },
      update: {
        phase: room.state.phase === "complete" ? "COMPLETE" : "ACTIVE",
        state: room.state,
        winnerId:
          room.state.winner === "one"
            ? room.players.one.userId
            : room.state.winner === "two"
              ? room.players.two?.userId
              : null,
        completedAt: room.state.phase === "complete" ? new Date() : null
      },
      create: {
        id: room.matchId,
        mode: "PVP",
        phase: room.state.phase === "complete" ? "COMPLETE" : "ACTIVE",
        playerOneId: room.players.one.userId,
        playerTwoId: room.players.two?.userId,
        ruleSet: room.state.rules,
        seed: room.state.seed,
        state: room.state,
        winnerId:
          room.state.winner === "one"
            ? room.players.one.userId
            : room.state.winner === "two"
              ? room.players.two?.userId
              : null,
        completedAt: room.state.phase === "complete" ? new Date() : null
      }
    });

    const lastEvent = room.state.events.at(-1);
    if (lastEvent) {
      await prisma.matchEvent.upsert({
        where: {
          matchId_sequence: {
            matchId: room.matchId,
            sequence: room.state.events.length
          }
        },
        update: {
          payload: lastEvent
        },
        create: {
          matchId: room.matchId,
          sequence: room.state.events.length,
          actorId:
            "player" in lastEvent
              ? lastEvent.player === "one"
                ? room.players.one.userId
                : room.players.two?.userId
              : null,
          eventType: lastEvent.type,
          payload: lastEvent
        }
      });
    }
  } catch {
    // Local socket play stays available even before a Postgres database is attached.
  }
}

function playerForSocket(room: DuelRoom, socketId: string): RoomPlayer | null {
  return Object.values(room.players).find((player) => player?.socketId === socketId) ?? null;
}

function requireUserId(userId: string | undefined): string {
  if (!userId) {
    throw new Error("A signed-in user id is required.");
  }

  return userId;
}

function normalizeRoomId(roomId: string | undefined): string {
  return (roomId ?? "").trim().toUpperCase();
}

function createInviteCode(): string {
  return randomUUID().slice(0, 6).toUpperCase();
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
