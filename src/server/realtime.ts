import type { Server as HttpServer } from "node:http";
import { randomUUID } from "node:crypto";
import { Server, type Socket } from "socket.io";
import { STARTER_CARD_IDS, SAME_PLUS_RULES, makeDeck } from "../game/content";
import { applyCommand, createGame } from "../game/engine";
import type { Deck, GameState, MatchCommand, PlayerSlot } from "../game/types";
import { prisma } from "../lib/db";
import { ensurePlayerBootstrap } from "../lib/economy";
import { toGameDeck } from "../lib/mappers";
import {
  ABSENCE_STRIKE_LIMIT,
  AI_TAKEOVER_MOVE_MS,
  DISCONNECT_GRACE_MS,
  TURN_MS,
  pairQueue,
  nextAbsenceStrike,
  pickAutoMove,
  type AbsenceReason,
  type QueueEntry,
} from "./matchmaking";
import { resolveSocketIdentity, type SocketIdentity } from "./socket-auth";

type RoomPlayer = {
  socketId: string;
  userId: string;
  name: string;
  slot: PlayerSlot;
  deck: Deck;
  connected: boolean;
  aiControlled: boolean;
  absenceStrikes: number;
  leftMatch: boolean;
};

type DuelRoom = {
  id: string;
  matchId: string;
  players: Partial<Record<PlayerSlot, RoomPlayer>>;
  state: GameState | null;
  turnTimer?: NodeJS.Timeout;
  turnEndsAt?: number;
  graceTimers: Partial<Record<PlayerSlot, NodeJS.Timeout>>;
};

const rooms = new Map<string, DuelRoom>();
const queue: QueueEntry[] = [];

export function registerRealtimeServer(server: HttpServer) {
  const io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      credentials: true,
    },
  });

  // Identity is established once per connection from the NextAuth session
  // cookie on the handshake; pvp handlers never trust client-supplied ids.
  io.use(async (socket, next) => {
    try {
      const identity = await resolveSocketIdentity(socket.request);
      if (identity) {
        socket.data.identity = identity;
      }
    } catch {
      // Guests may hold a socket; every pvp action requires an identity.
    }
    next();
  });

  io.on("connection", (socket) => {
    socket.on(
      "pvp:create",
      async (_payload: unknown, reply: (response: unknown) => void) => {
        try {
          const { userId, name } = requireIdentity(socket);
          const roomId = createInviteCode();
          const room: DuelRoom = {
            id: roomId,
            matchId: randomUUID(),
            players: {
              one: {
                socketId: socket.id,
                userId,
                name: name ?? "Host",
                slot: "one",
                connected: true,
                aiControlled: false,
                absenceStrikes: 0,
                leftMatch: false,
                deck: await loadPlayerDeck(
                  userId,
                  `${roomId}-one`,
                  "Host Deck",
                ),
              },
            },
            state: null,
            graceTimers: {},
          };
          rooms.set(roomId, room);
          socket.join(roomId);
          reply({ ok: true, roomId, slot: "one" });
          emitRoom(io, room);
        } catch (error) {
          reply({ ok: false, error: errorMessage(error) });
        }
      },
    );

    socket.on(
      "pvp:join",
      async (
        payload: { roomId?: string },
        reply: (response: unknown) => void,
      ) => {
        try {
          const { userId, name } = requireIdentity(socket);
          const room = rooms.get(normalizeRoomId(payload.roomId));
          if (!room) {
            throw new Error("Invite room not found.");
          }

          if (room.players.two) {
            throw new Error("Invite room is already full.");
          }

          if (room.players.one?.userId === userId) {
            throw new Error("You are already seated in this room.");
          }

          room.players.two = {
            socketId: socket.id,
            userId,
            name: name ?? "Challenger",
            slot: "two",
            connected: true,
            aiControlled: false,
            absenceStrikes: 0,
            leftMatch: false,
            deck: await loadPlayerDeck(
              userId,
              `${room.id}-two`,
              "Challenger Deck",
            ),
          };
          startMatch(room);
          armTurnTimer(io, room);

          socket.join(room.id);
          await persistRoom(room);
          reply({
            ok: true,
            roomId: room.id,
            slot: "two",
            state: room.state,
            turnEndsAt: room.turnEndsAt,
          });
          emitRoom(io, room);
        } catch (error) {
          reply({ ok: false, error: errorMessage(error) });
        }
      },
    );

    socket.on(
      "pvp:queue",
      async (_payload: unknown, reply: (response: unknown) => void) => {
        try {
          const { userId, name } = requireIdentity(socket);
          if (
            !queue.some(
              (entry) =>
                entry.userId === userId || entry.socketId === socket.id,
            )
          ) {
            queue.push({
              socketId: socket.id,
              userId,
              name: name ?? "Wayfarer",
            });
          }
          reply({ ok: true });
          await drainQueue(io);
        } catch (error) {
          reply({ ok: false, error: errorMessage(error) });
        }
      },
    );

    socket.on(
      "pvp:queue:cancel",
      (_payload: unknown, reply?: (response: unknown) => void) => {
        removeFromQueue(socket.id);
        reply?.({ ok: true });
      },
    );

    socket.on(
      "pvp:rejoin",
      async (
        payload: { roomId?: string },
        reply: (response: unknown) => void,
      ) => {
        try {
          const { userId } = requireIdentity(socket);
          const room = rooms.get(normalizeRoomId(payload.roomId));
          if (!room) {
            throw new Error("Room not found.");
          }

          const player = Object.values(room.players).find(
            (entry) => entry?.userId === userId,
          );
          if (!player) {
            throw new Error("You are not a player in this room.");
          }
          if (player.leftMatch) {
            throw new Error("You left this match and cannot resume it.");
          }
          if (player.aiControlled) {
            throw new Error(
              "Your seat has been handed to the AI for this match.",
            );
          }

          player.socketId = socket.id;
          player.connected = true;
          player.absenceStrikes = 0;
          socket.join(room.id);
          clearGrace(room, player.slot);
          io.to(room.id).emit("pvp:presence", {
            roomId: room.id,
            slot: player.slot,
            connected: true,
            aiControlled: false,
            absenceStrikes: player.absenceStrikes,
          });
          reply({
            ok: true,
            roomId: room.id,
            slot: player.slot,
            state: room.state,
            turnEndsAt: room.turnEndsAt,
          });
        } catch (error) {
          reply({ ok: false, error: errorMessage(error) });
        }
      },
    );

    socket.on(
      "pvp:play",
      async (
        payload: { roomId?: string; command?: MatchCommand },
        reply: (response: unknown) => void,
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
          if (player.leftMatch) {
            throw new Error("You left this match and cannot act in it.");
          }
          if (player.aiControlled) {
            throw new Error("This seat is now controlled by the AI.");
          }

          if (payload.command.player !== player.slot) {
            throw new Error(
              "Command player does not match the connected player.",
            );
          }

          room.state = applyCommand(room.state, payload.command);
          player.absenceStrikes = 0;
          player.connected = true;
          clearGrace(room, player.slot);
          await persistRoom(room);
          reply({ ok: true, state: room.state });
          if (room.state.phase === "complete") {
            emitRoom(io, room);
            closeRoom(io, room);
          } else {
            armTurnTimer(io, room);
            emitRoom(io, room);
          }
        } catch (error) {
          reply({ ok: false, error: errorMessage(error) });
        }
      },
    );

    socket.on(
      "pvp:concede",
      async (
        payload: { roomId?: string; player?: PlayerSlot },
        reply: (response: unknown) => void,
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
          if (player.leftMatch) {
            throw new Error("You left this match and cannot act in it.");
          }
          if (player.aiControlled) {
            throw new Error("This seat is now controlled by the AI.");
          }

          room.state = applyCommand(room.state, {
            type: "CONCEDE",
            player: payload.player,
          });
          await persistRoom(room);
          reply({ ok: true, state: room.state });
          emitRoom(io, room);
          closeRoom(io, room);
        } catch (error) {
          reply({ ok: false, error: errorMessage(error) });
        }
      },
    );

    socket.on(
      "pvp:close",
      async (
        payload: { roomId?: string },
        reply: (response: unknown) => void,
      ) => {
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

          if (room.state?.phase === "active" && !player.aiControlled) {
            player.connected = false;
            player.leftMatch = true;
            clearGrace(room, player.slot);
            socket.leave(room.id);
            if (allPlayersLeft(room)) {
              closeRoom(io, room);
              reply({ ok: true });
              return;
            }

            await handLeftSeatToAi(io, room, player.slot);
            reply({ ok: true });
            return;
          }

          closeRoom(io, room);
          reply({ ok: true });
        } catch (error) {
          reply({ ok: false, error: errorMessage(error) });
        }
      },
    );

    socket.on("disconnect", () => {
      removeFromQueue(socket.id);
      for (const room of rooms.values()) {
        const player = playerForSocket(room, socket.id);
        if (!player) {
          continue;
        }
        if (player.aiControlled || player.leftMatch) {
          continue;
        }

        player.connected = false;
        io.to(room.id).emit("pvp:presence", {
          roomId: room.id,
          slot: player.slot,
          connected: false,
          aiControlled: false,
          absenceStrikes: player.absenceStrikes,
        });

        // Hold the seat open briefly so a refresh can reconnect before this counts.
        clearGrace(room, player.slot);
        room.graceTimers[player.slot] = setTimeout(() => {
          void handleDisconnectGraceExpired(io, room, player.slot);
        }, DISCONNECT_GRACE_MS);
      }
    });
  });

  return io;
}

function startMatch(room: DuelRoom) {
  room.state = createGame({
    id: room.matchId,
    seed: room.matchId,
    rules: SAME_PLUS_RULES,
    playerOneDeck: room.players.one!.deck,
    playerTwoDeck: room.players.two!.deck,
  });
}

async function drainQueue(io: Server) {
  const { pairs, rest } = pairQueue(queue);
  queue.length = 0;
  queue.push(...rest);
  for (const [host, challenger] of pairs) {
    try {
      await startQueuedMatch(io, host, challenger);
    } catch (error) {
      const message = errorMessage(error);
      io.to(host.socketId).emit("pvp:queue:error", { error: message });
      io.to(challenger.socketId).emit("pvp:queue:error", { error: message });
    }
  }
}

async function startQueuedMatch(
  io: Server,
  host: QueueEntry,
  challenger: QueueEntry,
) {
  const roomId = createInviteCode();
  const room: DuelRoom = {
    id: roomId,
    matchId: randomUUID(),
    players: {
      one: {
        socketId: host.socketId,
        userId: host.userId,
        name: host.name,
        slot: "one",
        connected: true,
        aiControlled: false,
        absenceStrikes: 0,
        leftMatch: false,
        deck: await loadPlayerDeck(host.userId, `${roomId}-one`, "Host Deck"),
      },
      two: {
        socketId: challenger.socketId,
        userId: challenger.userId,
        name: challenger.name,
        slot: "two",
        connected: true,
        aiControlled: false,
        absenceStrikes: 0,
        leftMatch: false,
        deck: await loadPlayerDeck(
          challenger.userId,
          `${roomId}-two`,
          "Challenger Deck",
        ),
      },
    },
    state: null,
    graceTimers: {},
  };
  rooms.set(roomId, room);
  startMatch(room);
  io.sockets.sockets.get(host.socketId)?.join(roomId);
  io.sockets.sockets.get(challenger.socketId)?.join(roomId);
  io.to(host.socketId).emit("pvp:matched", { roomId, slot: "one" });
  io.to(challenger.socketId).emit("pvp:matched", { roomId, slot: "two" });
  armTurnTimer(io, room);
  await persistRoom(room);
  emitRoom(io, room);
}

function removeFromQueue(socketId: string) {
  const index = queue.findIndex((entry) => entry.socketId === socketId);
  if (index >= 0) {
    queue.splice(index, 1);
  }
}

function armTurnTimer(io: Server, room: DuelRoom) {
  clearTurnTimer(room);
  if (!room.state || room.state.phase !== "active") {
    return;
  }

  const current = room.players[room.state.currentPlayer];
  if (current?.aiControlled) {
    room.turnTimer = setTimeout(() => {
      void playAutomaticMove(io, room);
    }, AI_TAKEOVER_MOVE_MS);
    return;
  }

  const slot = room.state.currentPlayer;
  room.turnEndsAt = Date.now() + TURN_MS;
  room.turnTimer = setTimeout(() => {
    void handleTurnTimeout(io, room, slot);
  }, TURN_MS);
}

function clearTurnTimer(room: DuelRoom) {
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = undefined;
  }
  room.turnEndsAt = undefined;
}

async function handleTurnTimeout(io: Server, room: DuelRoom, slot: PlayerSlot) {
  if (
    !rooms.has(room.id) ||
    !room.state ||
    room.state.phase !== "active" ||
    room.state.currentPlayer !== slot
  ) {
    return;
  }

  const player = room.players[slot];
  if (!player) {
    return;
  }

  if (!player.aiControlled) {
    recordAbsenceStrike(io, room, slot, "timeout");
  }

  await playAutomaticMove(io, room);
}

async function playAutomaticMove(io: Server, room: DuelRoom) {
  if (!rooms.has(room.id) || !room.state || room.state.phase !== "active") {
    return;
  }

  try {
    room.state = applyCommand(room.state, pickAutoMove(room.state));
  } catch {
    return;
  }

  await persistRoom(room);
  if (room.state.phase === "complete") {
    emitRoom(io, room);
    closeRoom(io, room);
  } else {
    armTurnTimer(io, room);
    emitRoom(io, room);
  }
}

async function handleDisconnectGraceExpired(
  io: Server,
  room: DuelRoom,
  slot: PlayerSlot,
) {
  if (!rooms.has(room.id) || !room.state || room.state.phase !== "active") {
    return;
  }
  const player = room.players[slot];
  if (!player || player.connected) {
    return; // reconnected within the grace window
  }

  recordAbsenceStrike(io, room, slot, "disconnect");
  emitRoom(io, room);
  if (room.state.currentPlayer === slot) {
    await playAutomaticMove(io, room);
  }
}

function recordAbsenceStrike(
  io: Server,
  room: DuelRoom,
  slot: PlayerSlot,
  reason: AbsenceReason,
) {
  const player = room.players[slot];
  if (!player || player.aiControlled) {
    return;
  }

  const next = nextAbsenceStrike(player.absenceStrikes);
  player.absenceStrikes = next.strikes;
  player.connected = false;

  if (next.firstDrop) {
    handSeatToAi(io, room, slot, reason);
  } else {
    io.to(room.id).emit("pvp:presence", {
      roomId: room.id,
      slot,
      connected: false,
      aiControlled: false,
      absenceStrikes: player.absenceStrikes,
    });
  }
}

async function handLeftSeatToAi(io: Server, room: DuelRoom, slot: PlayerSlot) {
  if (!rooms.has(room.id) || !room.state || room.state.phase !== "active") {
    return;
  }

  const player = room.players[slot];
  if (!player) {
    return;
  }

  player.absenceStrikes = Math.max(player.absenceStrikes, ABSENCE_STRIKE_LIMIT);
  handSeatToAi(io, room, slot, "left", false);
  emitRoom(io, room);
  if (room.state.currentPlayer === slot) {
    await playAutomaticMove(io, room);
  }
}

function handSeatToAi(
  io: Server,
  room: DuelRoom,
  slot: PlayerSlot,
  reason: AbsenceReason,
  notifyDroppedSocket = true,
) {
  const player = room.players[slot];
  if (!player || player.aiControlled) {
    return;
  }

  clearGrace(room, slot);
  player.aiControlled = true;
  player.connected = false;

  if (notifyDroppedSocket) {
    io.to(player.socketId).emit("pvp:dropped", {
      roomId: room.id,
      slot,
      reason,
    });
  }
  io.sockets.sockets.get(player.socketId)?.leave(room.id);
  io.to(room.id).emit("pvp:presence", {
    roomId: room.id,
    slot,
    connected: false,
    aiControlled: true,
    absenceStrikes: player.absenceStrikes,
  });
}

function allPlayersLeft(room: DuelRoom) {
  const players = Object.values(room.players).filter(
    (player): player is RoomPlayer => Boolean(player),
  );
  return players.length >= 2 && players.every((player) => player.leftMatch);
}

function clearGrace(room: DuelRoom, slot: PlayerSlot) {
  const timer = room.graceTimers[slot];
  if (timer) {
    clearTimeout(timer);
    room.graceTimers[slot] = undefined;
  }
}

function emitRoom(io: Server, room: DuelRoom) {
  io.to(room.id).emit("pvp:room", {
    roomId: room.id,
    players: {
      one: room.players.one ? roomPlayerPayload(room.players.one) : null,
      two: room.players.two ? roomPlayerPayload(room.players.two) : null,
    },
    state: room.state,
    turnEndsAt: room.turnEndsAt,
  });
}

function roomPlayerPayload(player: RoomPlayer) {
  return {
    name: player.name,
    connected: player.connected,
    aiControlled: player.aiControlled,
    absenceStrikes: player.absenceStrikes,
  };
}

function closeRoom(io: Server, room: DuelRoom) {
  clearTurnTimer(room);
  for (const slot of Object.keys(room.graceTimers) as PlayerSlot[]) {
    clearGrace(room, slot);
  }
  rooms.delete(room.id);
  io.to(room.id).emit("pvp:closed", { roomId: room.id });
  io.in(room.id).socketsLeave(room.id);
}

async function loadPlayerDeck(
  userId: string,
  fallbackId: string,
  fallbackName: string,
): Promise<Deck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
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
              template: true,
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
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
        completedAt: room.state.phase === "complete" ? new Date() : null,
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
        completedAt: room.state.phase === "complete" ? new Date() : null,
      },
    });

    const lastEvent = room.state.events.at(-1);
    if (lastEvent) {
      await prisma.matchEvent.upsert({
        where: {
          matchId_sequence: {
            matchId: room.matchId,
            sequence: room.state.events.length,
          },
        },
        update: {
          payload: lastEvent,
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
          payload: lastEvent,
        },
      });
    }
  } catch {
    // Local socket play stays available even before a Postgres database is attached.
  }
}

function playerForSocket(room: DuelRoom, socketId: string): RoomPlayer | null {
  return (
    Object.values(room.players).find(
      (player) => player?.socketId === socketId,
    ) ?? null
  );
}

function requireIdentity(socket: Socket): SocketIdentity {
  const identity = socket.data.identity as SocketIdentity | undefined;
  if (!identity) {
    throw new Error("Sign in to play PvP.");
  }

  return identity;
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
