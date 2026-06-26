# Tessera — UI/UX Revamp Design Plan

> Direction: **sleek modern dark** game-client aesthetic, **full structural rework**.
> This document is the design spec for taking the vertical-slice UI to a polished, responsive (desktop + mobile) modern webapp. It does not change the game engine, API contracts, or data model.

---

## 1. Current State & Problems

The entire frontend is a single 1,017-line client component (`src/components/tessera-client.tsx`) rendered by a one-line `page.tsx`. It works as a slice but has structural and experiential gaps:

| Area | Problem |
| --- | --- |
| **Architecture** | One monolithic `"use client"` component holds all state, data fetching, socket logic, and ~10 sub-views. No routing — everything is a tab toggling a panel under a permanently-mounted board. |
| **Visual system** | ~6 ad-hoc Tailwind colors, no spacing/typography/radius/elevation scale, no tokens. Light "parchment" theme only. Zero border-radius, heavy `font-black` everywhere. |
| **Responsiveness** | Desktop-first column reflow only. On mobile the board, hand, and sidebar stack awkwardly; no bottom nav, no touch-sized targets, no consideration of thumb reach. |
| **Feedback & motion** | No animation on card placement or capture (the game's core moment), no transitions, no loading/skeleton/empty/error states beyond a single `apiMessage` string. |
| **Accessibility** | Decorative-only focus ring, no semantic landmarks beyond `main`, no ARIA on the board grid, color-only player identity (verdigris/ember). |
| **Polish** | Cards are flat CSS; no rarity treatment, no hover/selected affordance beyond a scale, no turn/timer indication, no win/lose moment. |

---

## 2. Design Principles

1. **The duel is the product.** The board is the hero. Every other surface (collection, decks, shop) is in service of getting a better duel. Capture animations and turn clarity are first-class, not afterthoughts.
2. **One system, many surfaces.** A single token layer drives every component. No more one-off hex codes in JSX.
3. **Responsive by structure, not by reflow.** Mobile and desktop get purpose-built layouts that share components, not a desktop grid squeezed into a phone.
4. **Calm dark, loud moments.** Neutral dark surfaces keep focus on cards; saturated color and motion are reserved for elements, rarity, captures, and outcomes.
5. **Accessible game feel.** Player identity, captures, and state are never communicated by color alone.

---

## 3. Visual Language — "Sleek Modern Dark"

### Palette (design tokens)

Defined as CSS custom properties on `:root` and consumed through Tailwind theme extension. Naming is semantic, not literal.

```
Surfaces
  --bg            #0b0d12   app background (near-black slate)
  --surface       #14171f   panels / cards
  --surface-2     #1c2029   raised panels, inputs
  --surface-3     #262b37   hover / active rows
  --border        rgba(255,255,255,0.08)
  --border-strong rgba(255,255,255,0.16)

Text
  --text          #f2f4f8
  --text-muted    #9aa3b2
  --text-faint    #5d6675

Brand / accent
  --accent        #5b8cff   primary action, focus, links (cool electric blue)
  --accent-hover  #7aa2ff
  --gold          #e8b54b   currency, rarity, rewards

Player identity (kept from engine semantics, modernized)
  --player-one    #34d3b0   teal  (you)
  --player-two    #ff6b5e   coral (opponent)

Feedback
  --positive #46c98b   --warning #f0b53f   --danger #ff5a5a
```

### Affinity colors

`Beast` warm-red · `Human` gold · `Construct` steel · `Undead` green · `Eldritch` magenta · `Myrathi` cyan · `Kynathi` violet. Each gets a `--affinity-{name}` token plus a soft glow variant for card frames and capture flashes.

### Rarity (5 tiers)

`COMMON` neutral · `UNCOMMON` green · `RARE` blue · `EPIC` violet · `LEGENDARY` gold — expressed via card frame border, a corner gem, and (epic/legendary) an animated holo sheen.

### Scale & primitives

- **Radius:** `sm 6px · md 10px · lg 16px · full`. Replaces today's zero-radius everywhere.
- **Elevation:** 3 shadow steps + an accent/affinity glow for selected/active states (glass effect via subtle border highlight + backdrop blur on overlays).
- **Spacing:** 4px base scale (already Tailwind default; enforce usage).
- **Type:** Display font for headings/brand (e.g. a geometric like *Space Grotesk* via `next/font`), Inter for body, tabular figures for card values and scores.
- **Motion:** `fast 120ms · base 200ms · slow 320ms`, ease-out standard; respect `prefers-reduced-motion`.

---

## 4. Information Architecture & Routing

Move from tab-state to real App Router routes with a persistent shell. Default redirect/home is `/play`.

```
/                 → marketing-lite landing / redirect to /play when authed
/play             Duel arena (PvE local + match entry)
/play/pve         Opponent ladder → starts a duel
/play/pvp         Create / join room → duel
/collection       Card library, filtering, transmute
/decks            Deck builder + deck list
/shop             Boosters, opening flow
/profile          Account, currency, sign-in/out, sync
```

- **Duel surface** becomes a focused screen (board + hand + match rail), not something permanently mounted under every tab.
- State currently in the monolith splits into: a session/profile context, a snapshot data hook (`useSnapshot`), a local-duel hook (`useLocalDuel`), and a PvP socket hook (`usePvpRoom`). API/socket logic moves out of components into `src/lib/client/`.

### App shell

- **Desktop:** left icon+label nav rail (collapsible), top bar with brand, currency, profile avatar. Content area max-width container.
- **Mobile:** top bar (brand + currency) + bottom tab bar (Play, Collection, Decks, Shop, Profile) with large touch targets. Duel hand docks to the bottom safe-area.

---

## 5. Component Breakdown

Decompose the monolith into a real component library under `src/components/`:

```
ui/            primitives: Button, IconButton, Card (panel), Input, Badge,
               Tab, Dialog/Sheet, Toast, Skeleton, EmptyState, Tooltip
layout/        AppShell, NavRail, BottomNav, TopBar, PageHeader
game/          GameBoard, BoardTile, PlayingCard, CardFace (rarity+affinity),
               Hand, ScoreBar, TurnIndicator, RulePills, MatchLog,
               CaptureFx, OutcomeOverlay
collection/    CardGrid, CardFilters, CardDetailSheet, TransmuteDialog
decks/         DeckBuilder, DeckSlotTray, DeckList, DeckCard
shop/          PackCard, PackOpenAnimation, OpenedCardsReveal
account/       AuthPanel, ProfileSummary, CurrencyChip
```

### Hero components

- **`PlayingCard` / `CardFace`** — the most-reused component. Rebuilt with: rarity frame, affinity-tinted background + soft glow, four large tabular side values with clear directional placement, art window, name plate. Variants: `hand` (interactive, hover-lift, selectable ring), `board` (owner-colored frame + flip-on-capture), `compact` (lists), `reveal` (shop). Owner identity = colored frame **+** a corner pip icon (not color alone).
- **`GameBoard`** — 3×3 with `role="grid"`, keyboard navigable, drop-target highlighting only on legal empty cells while a card is selected, last-placed pulse.
- **`CaptureFx`** — the signature moment: captured cards flip to the new owner's color with a stagger; Same/Plus/Combo captures get a labeled flash (e.g. "COMBO ×3"). Drives game feel.
- **`OutcomeOverlay`** — win/lose/draw moment with final score, rewards earned (PvE), and a clear "Play again" / "Next opponent" CTA. Currently a one-line text in the board header.
- **`TurnIndicator`** — whose turn, with player-colored avatar; PvP shows opponent presence/"waiting".

---

## 6. Screen-by-Screen Plan

**Duel (`/play`)**
- Layout: board centered, score bar above, your hand below, collapsible match rail (rules + log) to the side on desktop / behind a sheet on mobile.
- Select a card → legal tiles light up → tap tile to place → capture animation → opponent turn. Reset and concede as explicit actions.
- Empty/idle state when no match active: "Choose an opponent" (PvE) or "Create/Join room" (PvP) cards.

**PvE (`/play/pve`)** — Opponent ladder as a vertical progression of opponent cards: portrait/sigil, name, difficulty, reward (gold chip), active rule pills, locked/unlocked state. "Start duel" routes into the arena.

**PvP (`/play/pvp`)** — Create room (shows shareable code prominently with copy button) or join via code input. Connection/seat status, waiting-for-opponent state, error toasts on rejected joins.

**Collection (`/collection`)** — Responsive card grid with filters (affinity, rarity, owned count), sort, and a search box. Tap a card → detail sheet with lore, stats, and Transmute (confirm dialog showing currency gained). Replaces today's cramped 2-column list.

**Decks (`/decks`)** — Deck builder: a 5-slot tray (the exactly-five contract made visual) + filterable collection grid below; tap to add/remove, drag-reorder on desktop. Validation (need exactly 5) shown inline, not as an error string. Save/rename; list of saved decks with active indicator.

**Shop (`/shop`)** — Pack cards with art, price (gold chip), and description. Opening triggers a reveal animation (pack → cards flip one by one with rarity flourish). Disabled/sign-in prompt when unauthenticated. Currency updates animate.

**Profile (`/profile`)** — Auth (dev credentials sign-in form when logged out; profile summary, currency, deck slots, sync, sign-out when logged in). Toasts replace the single `apiMessage` banner.

---

## 7. Responsive & Mobile Strategy

- **Breakpoints:** mobile `<640`, tablet `640–1024`, desktop `>1024`.
- **Navigation:** bottom tab bar on mobile, left rail on desktop.
- **Duel on mobile:** board sized to viewport width, hand as a horizontally-scrollable / fanned dock pinned to the bottom safe-area, match rail behind a bottom sheet. All tap targets ≥ 44px.
- **Grids:** collection/shop reflow 2→3→4+ columns by breakpoint.
- **Overlays:** Dialog on desktop, full-height Sheet on mobile (shared component, responsive presentation).

---

## 8. Motion & Feedback

- Card place: drop + settle. Capture: flip to new owner with stagger. Combo/Same/Plus: labeled burst.
- Selection: hand card lifts; legal tiles breathe softly.
- Currency/score changes: count-up tween.
- Pack open: anticipation → reveal cascade.
- All non-essential motion gated by `prefers-reduced-motion: reduce`.
- Global toast system for API/socket results; skeletons for snapshot/bootstrap load; per-surface empty states.

---

## 9. Accessibility

- Semantic landmarks (`nav`, `main`, `aside`), board as labeled `grid`, full keyboard play (select card, arrow to tile, enter to place).
- Player/owner identity = color **+** icon/label. Captures announced via `aria-live`.
- WCAG AA contrast on the dark palette (verified for text and accent on surfaces).
- Visible, consistent focus rings using `--accent`.

---

## 10. Technical Approach

- **Tokens:** CSS variables in `globals.css` + Tailwind `theme.extend` mapping to them (`bg-surface`, `text-muted`, `border-default`, etc.). Optional: enables future light theme without component changes.
- **Fonts:** `next/font` for display + body (self-hosted, no layout shift).
- **Animation:** CSS transitions/keyframes first; add `framer-motion` (or `motion`) only for orchestrated sequences (capture stagger, pack reveal, route transitions). One dependency, scoped to `game/` and `shop/`.
- **State/data:** extract hooks (`useSnapshot`, `useLocalDuel`, `usePvpRoom`) and a thin client API module; components stay presentational. No engine/API changes.
- **No backend changes:** all existing endpoints, socket events, and Prisma models are untouched; this is a presentation-layer rework.

---

## 11. Phased Delivery

1. **Foundation** — Token system, Tailwind config, fonts, `ui/` primitives, AppShell + routing skeleton, dark base. *(No feature regressions; existing screens ported onto the shell.)*
2. **Duel core** — `GameBoard`, `PlayingCard`/`CardFace` rebuild, `ScoreBar`/`TurnIndicator`, capture FX, outcome overlay. The signature experience.
3. **Surfaces** — Collection (filters + detail sheet), Decks (5-slot builder), Shop (reveal), PvE ladder, PvP lobby, Profile.
4. **Responsive + motion + a11y pass** — mobile layouts, bottom nav, sheets, reduced-motion, keyboard/ARIA, toasts/skeletons/empty states.
5. **Polish** — rarity holo, micro-interactions, count-ups, sound hooks (optional), QA across breakpoints; update Playwright smoke tests for new routes/selectors.

---

## 12. Out of Scope

Game-engine rules, AI, API contracts, auth provider, Prisma schema, new game modes/features. This plan is strictly UI/UX and the client-side structure that supports it.
