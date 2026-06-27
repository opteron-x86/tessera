"use client";

import { ArrowLeft, Copy, Loader2, Wifi } from "lucide-react";
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
    roomId,
    joinCode,
    setJoinCode,
    pvpSlot,
    pvpState,
    createPvpRoom,
    joinPvpRoom,
    setDuelMode,
    notify
  } = useTessera();

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
          <p className="text-sm text-content-muted">Play a live match over an invite code.</p>
        </div>
        <Badge className="border-line-strong text-content-muted">
          {pvpSlot ? `Seat ${pvpSlot}` : "Idle"}
        </Badge>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          variant="accent"
          size="lg"
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
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
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

      {roomId && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-content-muted">Room code</p>
            <p className="font-display text-xl font-bold tracking-widest text-gold">{roomId}</p>
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
          <Loader2 size={16} className="animate-spin" /> Waiting for an opponent to join…
        </p>
      )}
    </div>
  );
}
