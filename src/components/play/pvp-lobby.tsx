"use client";

import { ArrowLeft, Copy, Loader2, Swords, Wifi, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/panel";
import { useTessera } from "@/lib/client/store";

export function PvpLobbyScreen() {
  const router = useRouter();
  const {
    status,
    roomId,
    joinCode,
    setJoinCode,
    pvpSlot,
    pvpState,
    searching,
    createPvpRoom,
    joinPvpRoom,
    queueMatch,
    cancelQueue,
    setDuelMode,
    notify,
  } = useTessera();
  const authed = status === "authenticated";

  // Once both seats are filled the server pushes the initial state — enter the duel.
  useEffect(() => {
    if (pvpState) {
      setDuelMode("pvp");
      router.push("/play/duel");
    }
  }, [pvpState, setDuelMode, router]);

  const waiting = Boolean(roomId) && !pvpState;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 py-4">
      <header className="flex items-center gap-3">
        <Link
          href="/play"
          aria-label="Back to arena"
          className="grid h-9 w-9 place-items-center rounded-md border border-line text-content-muted transition-colors hover:bg-surface-2 hover:text-content"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">PvP duel</h1>
          <p className="text-sm text-content-muted">
            Play a live match over an invite code.
          </p>
        </div>
        <Badge className="border-line-strong text-content-muted">
          {pvpSlot ? `Seat ${pvpSlot}` : "Idle"}
        </Badge>
      </header>

      {/* online play needs a verified identity — the socket server rejects guests */}
      {!authed ? (
        <div className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-content-muted">
          Sign in on the{" "}
          <Link href="/profile" className="font-semibold text-accent">
            Profile
          </Link>{" "}
          tab to duel online.
        </div>
      ) : searching ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3">
          <span className="inline-flex items-center gap-2 text-sm font-medium">
            <Loader2 size={16} className="animate-spin text-accent" /> Searching
            for an opponent…
          </span>
          <Button size="sm" variant="ghost" onClick={cancelQueue}>
            <X size={15} /> Cancel
          </Button>
        </div>
      ) : (
        <Button variant="accent" size="lg" onClick={() => void queueMatch()}>
          <Swords size={17} /> Quick match
        </Button>
      )}

      {authed && (
        <>
          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-content-faint">
            <span className="h-px flex-1 bg-line" /> or play a friend{" "}
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="primary"
              size="lg"
              disabled={searching}
              onClick={() => {
                setDuelMode("pvp");
                void createPvpRoom();
              }}
            >
              <Wifi size={17} /> Create room
            </Button>
            <div className="flex gap-2">
              <Input
                value={joinCode}
                onChange={(event) =>
                  setJoinCode(event.target.value.toUpperCase())
                }
                placeholder="ROOM CODE"
                className="uppercase"
              />
              <Button
                size="lg"
                onClick={() => {
                  setDuelMode("pvp");
                  void joinPvpRoom();
                }}
              >
                Join
              </Button>
            </div>
          </div>
        </>
      )}

      {roomId && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-content-muted">
              Room code
            </p>
            <p
              data-testid="room-code"
              className="font-display text-xl font-bold tracking-widest text-gold"
            >
              {roomId}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              void navigator.clipboard?.writeText(roomId);
              notify("Room code copied.", "success");
            }}
          >
            <Copy size={15} /> Copy
          </Button>
        </div>
      )}

      {waiting && (
        <p className="inline-flex items-center gap-2 text-sm text-content-muted">
          <Loader2 size={16} className="animate-spin" /> Waiting for an opponent
          to join…
        </p>
      )}
    </div>
  );
}
