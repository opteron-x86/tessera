# Tessera

Tessera is a greenfield TypeScript card game inspired by 3x3, four-sided tactical capture duels.

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