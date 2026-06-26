# Tessera

Tessera is a greenfield TypeScript card game inspired by 3x3, four-sided tactical capture duels. This repo contains the first vertical slice: a pure deterministic rules engine, a Next.js dashboard, seeded lore-card placeholders, Prisma/PostgreSQL models, Auth.js login, economy endpoints, PvE play, and Socket.IO invite-room PvP.

## Stack

- Next.js App Router, React, Tailwind CSS
- Pure game engine in `src/game`
- Prisma with PostgreSQL
- Auth.js/NextAuth with a credentials dev login
- Socket.IO custom server for live PvP rooms
- Vitest and Playwright
- Railway config in `railway.json`

## Local Setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` plus `NEXTAUTH_SECRET`.
3. Run `pnpm db:migrate` and `pnpm db:seed`.
4. Start the app with `pnpm dev`.

The default seeded login is `player@tessera.local`.

## Useful Commands

- `pnpm content:generate`: regenerate TypeScript card content from `content/cards/*.yaml`
- `pnpm dev`: Next.js plus Socket.IO custom server
- `pnpm build`: Prisma generate and Next production build
- `pnpm test`: deterministic engine and contract tests
- `pnpm e2e`: browser smoke tests
- `pnpm db:seed`: card catalog, booster, PvE opponents, and demo player

## Card Library

Cards are authored in YAML under `content/cards/`. Each card has a `series`, `collectorNumber`, `rarity`, numeric power `tier`, sides, lore, palette, and optional art URL. Set-local art lives beside the content in `content/cards/<series>/<card-id>.jpg` or another supported image format (`.jpeg`, `.png`, `.webp`, `.svg`); when `artUrl` is omitted, the generator uses that file automatically and copies it to `public/cards/<series>/`. The app reads generated TypeScript at `src/game/content.generated.ts`; edit the YAML source, then run `pnpm content:generate` or any command that already regenerates content (`pnpm dev`, `pnpm build`, `pnpm db:seed`).

## Implemented Slice

- Core 3x3 board and exactly-five-card deck contract
- Directional capture, Open, Same, Plus, and Combo rules
- Placeholder lore card catalog and local SVG card art
- PvE opponent definitions with rule sets and rewards
- Collection, deck builder, shop, booster opening, and transmutation UI/API paths
- Invite-code PvP rooms with server-authoritative move validation
- Prisma models for future upgrades, tournaments, cosmetics, and paid entitlements
