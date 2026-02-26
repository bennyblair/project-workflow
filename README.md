# FlowLine

Visual workflow board with timer-based ticket movement. Tickets progress through
time-based swim lanes on an ACTIVE grid, automatically advancing rows as time elapses.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Database:** PostgreSQL 16 via Docker
- **ORM:** Prisma 7
- **Styling:** TailwindCSS 4 + shadcn/ui
- **Package Manager:** pnpm

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start the database
docker compose up -d

# 3. Run migrations
pnpm prisma:migrate

# 4. Seed sample data
pnpm prisma:seed

# 5. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm prisma:migrate` | Run Prisma migrations |
| `pnpm prisma:seed` | Seed the database |
| `pnpm prisma:studio` | Open Prisma Studio |
| `pnpm db:reset` | Reset database (drop + migrate + seed) |

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://flowline:flowline@localhost:5432/flowline?schema=public` | PostgreSQL connection string |

## Project Structure

```
src/
├── app/
│   ├── globals.css        # Tailwind + theme variables
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page (board list)
├── components/
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── prisma.ts          # Prisma client singleton
│   └── utils.ts           # Shared utilities
prisma/
├── schema.prisma          # Database schema
├── prisma.config.ts       # Prisma 7 config
└── seed.ts                # Seed script
```
