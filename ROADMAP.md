# Tessera — Roadmap

> Direction: take the playable vertical slice to a game people return to. The engine and the
> player-facing UI are strong; the gaps are **gameplay depth**, **reasons to return**, and a
> **real PvP layer**. This roadmap sequences foundational/lower-risk work first, then the
> marquee depth play, then content and live-ops.

## Where we are (baseline)

**Solid**
- Pure, deterministic rules engine ([src/game/engine.ts](src/game/engine.ts)) with Open, Same, Plus, Combo, SameWall, Legion, Decimation ([RuleSet](src/game/types.ts)).
- Minimax AI with tiers beginner→master, search depth up to 4 ([src/game/ai.ts](src/game/ai.ts)).
- Reworked UI across Arena/Duel, Collection, Decks, Shop (responsive, reveal flow, filters, multi-deck).
- Server-authoritative PvE; invite-code PvP over Socket.IO ([src/server/realtime.ts](src/server/realtime.ts)).
- Economy: currency, boosters, transmute; Prisma/Postgres models.

**Gaps**
- Cards are pure stat-sticks (4 sides + affinity) — no abilities; deckbuilding is shallow.
- Small content: ~36 cards, 1 booster, 4 linear PvE opponents; art partly placeholder.
- PvP is a tech demo: no matchmaking, turn timer, reconnection, rating, or result persistence.
- No retention loop: [PveProgress](prisma/schema.prisma) tracks wins, but nothing pulls a player back tomorrow.
- Modeled-but-unsurfaced: `Match`/`MatchEvent` (replays/history), `Entitlement` (cosmetics), `CardInstance.upgradeLevel` (upgrades).

---

## Phase 1 — Foundations: make PvP real + a minimal retention loop

Lower-risk, mostly additive, unlocks everything social. Do this first.

### 1.1 PvP hardening
- **Turn timer + auto-pass.** Per-turn clock; on expiry, auto-play a legal move (or forfeit the turn) server-side in [realtime.ts](src/server/realtime.ts). *Done when:* a stalling player can't freeze a match; timer is authoritative and shown in the duel header.
- **Reconnection.** Rejoin an in-progress room after refresh/drop using session + room id; rehydrate `pvpState`/`pvpSlot` in [store](src/lib/client/store.tsx). *Done when:* refreshing mid-match returns you to the live board.
- **Match persistence.** Write `Match` + `MatchEvent` rows for PvP (PvE already has the path) on each move/result. *Done when:* completed matches appear in a profile match history.
- **Matchmaking queue.** A "Quick match" that pairs two queued players (fallback to an async ghost duel — see 3.4). *Done when:* a player can find a game without sharing a code.

### 1.2 Ranked + seasons
- **ELO/MMR** on `PlayerProfile`; update on PvP result. Bronze→… tiers, season reset.
- *Done when:* ranked matches adjust rating, a rank badge shows on Profile, and a season has start/end dates.

### 1.3 Retention loop
- **Daily quests** (e.g., "win 3 PvE", "capture 10 cards", "play 5 matches") + **login streak**, granting currency. New `DailyQuest`/`QuestProgress` models + a claim UI.
- **Player level / XP** from matches and quests; cosmetic/currency rewards at thresholds.
- **Achievements** (first legendary, win without losing a card, beat each opponent).
- *Done when:* logging in shows fresh quests, XP/level advance, and there's a daily reason to play.

### 1.4 Profile surface (finish what's modeled)
- Match history (from 1.1), rank, level, achievements, currency ledger view ([CurrencyLedger](prisma/schema.prisma)).
- *Done when:* Profile is a real account hub, not just sign-in.

---

## Phase 2 — Depth: card abilities + special tiles (the marquee play)

Highest ceiling, highest risk (engine + AI + balance). Prototype behind a flag; expand the
deterministic test suite alongside.

### 2.1 Keyword/ability system
- Add an optional `abilities` field to card content (YAML → [content.generated.ts](src/game/content.generated.ts)) and resolve them in the engine as deterministic, ordered effects.
- Starter keywords: **Ward** (immune to Same/Plus flips), **Surge** (+1 sides to same-affinity neighbors), **Bulwark** (uncapturable on the turn played), **Ambush** (reveal an opponent hand card), **Echo** (on capture, weakens an adjacent enemy).
- Teach the AI: extend the evaluation/`minimax` in [ai.ts](src/game/ai.ts) to account for abilities so it stays competitive.
- *Done when:* abilities are authored in YAML, resolve deterministically (covered by engine tests), animate on the board, and the AI plays around them.

### 2.2 Special board tiles (signature mechanic — lean into "Tessera")
- Per-match tile modifiers: **bonus tile** (+1 to placed card's sides), **blocked tile**, **affinity tile** (boosts a specific affinity). Engine generates them from the match seed.
- *Done when:* tiles render distinctly, affect capture math deterministically, and feed AI evaluation.

### 2.3 Card upgrades
- Surface `upgradeLevel` (already in schema/transmute math): spend currency/duplicates to raise a card's sides; reflect in [CardFace](src/components/game/card-face.tsx) and deck stats.
- *Done when:* upgrading is a currency sink with visible power gains, integrated with Collection/transmute.

---

## Phase 3 — Content, events & live-ops

Rides on Phases 1–2. Variety and longevity from systems already in place.

### 3.1 Content volume
- Grow the catalog and finish the affinity expansion (new affinities already entering [cards.ts](src/lib/client/cards.ts)); more boosters (reuse the odds UI), a longer/branching PvE ladder, real art over SVG placeholders.

### 3.2 Daily seeded Gauntlet
- Everyone gets the same board seed + rule mutator each day; global leaderboard. Cheap replayability from the deterministic engine; results are server-verifiable.

### 3.3 Rule-mutator events
- Expose the existing rule flags as a **modifier system** ("Chaos: random rule", "Elite: +1 all sides", "Order: sorted deck") for rotating weekly events.

### 3.4 Async "ghost" duels
- Fight an AI piloting a snapshot of a real player's deck when no live opponent is queued — solves PvP cold-start and backs matchmaking (1.1).

### 3.5 Replays & shareable matches
- Reconstruct a match from persisted `MatchEvent`s; shareable match link + spectate. Social/virality and a balance-debugging tool.

### 3.6 Cosmetics economy
- Surface the `Entitlement` model (sleeves, borders, alt-art) in the shop as no-pay-to-win vanity.

---

## Cross-cutting (do continuously)

- **Balance simulation.** Self-play harness over the pure engine to flag dominant cards/abilities before release — essential as content and keywords scale.
- **Test depth.** Engine unit tests per keyword/tile/rule interaction; contract tests for new APIs; extend the Playwright smoke flows ([e2e/](e2e/)) to cover new surfaces.
- **Observability.** Basic match/economy analytics (win rates by card, currency flow) to drive balance and live-ops.
- **Tech debt.** Consider an `activeDeckId` column so the active deck persists across reloads (currently client-side only); keep `content:generate` the single source of truth for cards.

---

## Sequencing summary

1. **Phase 1** — PvP hardening (timer, reconnection, persistence, matchmaking), ranked seasons, daily quests/XP, Profile hub. *Foundational, low-risk, unlocks social + retention.*
2. **Phase 2** — Keyword/ability system + special tiles + card upgrades. *Marquee depth; prototype behind a flag with heavy engine tests.*
3. **Phase 3** — Content, Gauntlet, mutator events, ghost duels, replays, cosmetics. *Longevity and live-ops on top of the foundation.*

Guiding rule: every engine change stays **deterministic and test-covered**, and the AI is updated in lockstep so single-player never degrades.
