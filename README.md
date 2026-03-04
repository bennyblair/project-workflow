# FlowLine

Visual workflow board with timer-based ticket movement. **Projects** contain boards,
and **ticket types are shared across all boards** within a project. Tickets progress
through time-based swim lanes on an ACTIVE grid, automatically advancing rows as time elapses.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript (strict) |
| Database | PostgreSQL 16 via Docker |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Validation | Zod 4 |
| Styling | TailwindCSS 4 + shadcn/ui (oklch theme) |
| Drag & Drop | dnd-kit (core + sortable + utilities) |
| Tests | Playwright (Chromium) |
| Package Mgr | pnpm 10 |

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 10
- **Docker** (Docker Desktop, Rancher Desktop, or compatible runtime)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/bennyblair/project-workflow.git
cd project-workflow

# 2. Install dependencies
pnpm install

# 3. Copy environment file
cp .env.example .env

# 4. Start the database
docker compose up -d

# 5. Run migrations
pnpm prisma:migrate

# 6. Seed sample data (1 project with 2 boards, shared ticket types, teams, people, swimlanes, color rules)
pnpm prisma:seed

# 7. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/boards`, showing projects and their boards.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Playwright smoke tests |
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

## Architecture

### Routes

| Route | Description |
|---|---|
| `/` | Redirects to `/boards` |
| `/boards` | Home page: shows projects with nested boards, create project & board |
| `/board/[boardId]` | Main board view: TODO \| ACTIVE grid \| DONE |
| `/settings/[boardId]` | Board settings: swimlanes, color rules, people & teams |
| `/project/[projectId]/settings` | Project settings: ticket types (shared across boards) |

### Board Layout

```
┌──────────┬──────────────────────────────────────┬──────────┐
│          │   ← Boards   Board Name   Settings → │          │
│          ├──────────────────────────────────────┤          │
│          │          ACTIVE GRID                  │          │
│   TODO   │  Swimlane A  │  Swimlane B  │  ...   │   DONE   │
│ Backlog  │──────────────┼──────────────┼────────│  Bucket  │
│          │  step 9 (red)│              │        │          │
│  (list)  │  step 5 (yel)│              │        │  (list)  │
│          │  ...         │              │        │          │
│          │  step 0 (grn)│              │        │          │
└──────────┴──────────────────────────────────────┴──────────┘
```

- **TODO** — vertical backlog list; drag to ACTIVE to start the timer
- **ACTIVE** — grid with columns = swimlanes, rows = time steps (0 = newest at bottom, maxSteps-1 = oldest at top). Tickets auto-advance rows based on `TicketType.stepIntervalHours`. Rows have a **color gradient**: green (step 0) → yellow (middle) → red (oldest).
- **DONE** — completed tickets; drag back to ACTIVE to reopen (resets `startedAt`)
- **Board title** is centered in the header bar

### Timer-Based Movement

Movement speed is **per ticket type** (not global). Each `TicketType` has a `stepIntervalHours` setting (integer, **1–24 hours**):

```
stepIndex = floor((now - startedAt) / (stepIntervalHours × 3600))
```

Tickets at `stepIndex >= maxSteps - 1` stay in the top row (oldest). The client refreshes on `board.refreshIntervalSeconds` to recompute positions — no server cron needed. The settings UI displays intervals in hours.

### Drag & Drop Flows

| Flow | Action |
|---|---|
| TODO → ACTIVE cell | Set status=ACTIVE, startedAt=now. **Smart snap**: if ticket already matches a swimlane, it snaps there; otherwise `onDropPatch` is applied from the drop target. |
| ACTIVE → ACTIVE (cross-swimlane) | Apply target swimlane's `onDropPatch`, keep `startedAt` |
| ACTIVE → DONE | Set status=DONE, doneAt=now |
| DONE → TODO | Set status=TODO, clear startedAt/doneAt |
| DONE → ACTIVE | Set status=ACTIVE, startedAt=now (timer restarts). **Smart snap** also applies. |

### Smart Swimlane Snap

When a ticket enters the ACTIVE grid (from TODO or DONE), the server checks whether the ticket's **existing fields** (teamId, assigneeId, typeId, etc.) already match a swimlane filter:

- **Pre-assigned tickets**: If a match is found, the ticket automatically "snaps" to the correct swimlane — regardless of where the user dropped it. No `onDropPatch` is applied.
- **Unassigned tickets**: If no swimlane matches, the drop-target swimlane's `onDropPatch` is applied as before, assigning the ticket to the target lane.

### Parent-Child Ticket Relationships

Tickets can have a **parent** ticket (optional, self-referential). A parent can have multiple children.

- **Ticket detail panel** shows the parent (if linked) with a link to view it and an "Unlink" button, plus a list of child tickets.
- **Link Parent** button opens a search dialog that queries all tickets within the same project by title.
- Setting or removing a parent generates a `PARENT_CHANGED` audit event.

### Swimlane Filters

Each swimlane has a `filterExprJson` — an AND/OR expression tree that determines which tickets belong to it. Example:

```json
{
  "type": "condition",
  "field": "team.name",
  "operator": "eq",
  "value": "Frontend"
}
```

When a ticket is dropped into a swimlane, the swimlane's `onDropPatchJson` is applied to make the ticket match the filter (e.g., `{ "teamId": "<frontend-team-id>" }`). Swimlane order can be changed via **drag-and-drop** in Settings → Swimlanes.

### Color Rules

Ordered list of `whenExprJson` + `colorHex`. First matching rule wins; fallback is `TicketType.defaultColorHex`. Supports `stepIndex` conditions for time-based color changes (e.g., turn red when `stepIndex >= 8`).

### Audit Events

All human actions are logged (automatic timer movement is not):

| Event Type | Trigger |
|---|---|
| `TICKET_CREATED` | Creating a new ticket |
| `STATUS_CHANGED` | Any status transition (data: `{from, to}`) |
| `TITLE_UPDATED` | Editing ticket title |
| `DESCRIPTION_UPDATED` | Editing ticket description |
| `TYPE_CHANGED` | Changing ticket type |
| `ASSIGNEE_CHANGED` | Changing assignee |
| `TEAM_CHANGED` | Changing team |
| `PARENT_CHANGED` | Linking or unlinking a parent ticket |
| `SWIMLANE_DROPPED` | Drop that applies `onDropPatch` |
| `ORDER_CHANGED` | Reordering within a cell |

### Project Structure

```
src/
├── actions/               # Server actions (board, project, ticket, move-ticket, settings, search-tickets, ticket-detail)
├── app/
│   ├── board/[boardId]/   # Board page + BoardShell client component
│   ├── boards/            # Home page: projects + boards, create forms
│   ├── project/[projectId]/settings/ # Project settings (ticket types)
│   ├── settings/[boardId]/ # Board settings (swimlanes, colors, people & teams)
│   ├── globals.css        # Tailwind + oklch theme variables
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing redirect → /boards
├── components/
│   ├── ui/                # shadcn/ui primitives (button, input, card, sheet, tabs, label, dialog)
│   ├── active-grid.tsx    # ACTIVE grid with swimlane columns × time rows
│   ├── done-bucket.tsx    # DONE column
│   ├── draggable-ticket.tsx # dnd-kit draggable wrapper
│   ├── droppable-zone.tsx # dnd-kit droppable wrapper
│   ├── expression-builder.tsx # Visual AND/OR filter rule builder
│   ├── link-parent-dialog.tsx # Search & select parent ticket dialog
│   ├── ticket-card.tsx    # Ticket card rendering
│   ├── ticket-detail-panel.tsx # Slide-out detail panel (with parent/children)
│   └── todo-backlog.tsx   # TODO column + create ticket form
├── lib/
│   ├── engine/            # Pure functions: step-index, filter-evaluator, color-evaluator, order-key
│   ├── schemas/           # Zod validation schemas (board, project, ticket, settings)
│   ├── prisma.ts          # PrismaClient singleton with PrismaPg adapter
│   └── utils.ts           # cn() utility
e2e/
└── smoke.spec.ts          # 6 Playwright smoke tests
prisma/
├── schema.prisma          # Database schema (Project, Board, TicketType, etc.)
├── prisma.config.ts       # Prisma 7 adapter config
└── seed.ts                # Seeds 1 project with 2 boards
```

## Testing

```bash
# Run all smoke tests (starts dev server automatically)
pnpm test

# Run with headed browser for debugging
npx playwright test --headed

# Run a single test
npx playwright test -g "create a new board"
```

The smoke tests cover the full lifecycle: create board → create ticket → drag TODO→ACTIVE → view audit events → drag ACTIVE→DONE → drag DONE→ACTIVE.

## MVP Assumptions

1. **Single-user, no auth** — all actions are treated as admin. Code is structured so authentication/authorization can be added later (server actions, separate concerns).
11. **Projects group boards** — boards always belong to a project. Ticket types are defined at the project level and shared across all boards in the project.
2. **No real attachment storage** — the Attachments tab exists in the ticket detail panel as a placeholder UI ("Attachments coming soon").
3. **Client-side timer only** — no server-side cron or background jobs. The board refreshes via `setInterval` + `router.refresh()` on the client.
4. **No audit logging of automatic movement** — only human-initiated actions (drag, edit, create) are logged.
5. **Swimlane assignment is filter-based** — tickets are assigned to swimlanes by evaluating filter expressions, not by explicit assignment. The `onDropPatch` mechanism bridges the gap when dropping.
6. **orderKey float precision** — ticket ordering uses float-based `orderKey` values with midpoint insertion. This works well for thousands of reorders but may need rebalancing in a long-lived production system.
7. **1-hour minimum step intervals** — `stepIntervalHours` accepts 1–24 (hours). Sub-hour intervals are not supported. This keeps the board manageable and ensures meaningful time-based progression.
8. **Smart swimlane snap** — when tickets enter ACTIVE with pre-existing field values that match a swimlane filter, they automatically snap to the correct lane regardless of where the user dropped them.
9. **Local PostgreSQL only** — the app expects a local Postgres instance via Docker. No cloud database configuration is provided.
10. **No real-time collaboration** — changes by one user are not pushed to other users. The auto-refresh interval provides eventual consistency for a single-user POC.
11. **Parent-child is optional** — any ticket can optionally have a parent. Circular references are not enforced at the DB level (MVP limitation). Parents can be from any board within the same project.
