# FlowLine — Implementation Plan

Ordered milestones derived from SPEC.md. Each milestone is a shippable increment.
Check off items as they are completed.

---

## Milestone 1: Project Scaffold & Infrastructure ✅
- [x] Initialize Next.js 16 App Router project with pnpm + TypeScript
- [x] Configure TailwindCSS + shadcn/ui
- [x] Create `docker-compose.yml` for local PostgreSQL
- [x] Create `.env.example` with DATABASE_URL
- [x] Set up Prisma ORM, define full schema (all models from spec)
- [ ] Generate and run initial Prisma migration *(requires Postgres)*
- [x] Create seed script with 2 boards, types (Bug 60s, Task 180s, Feature 300s), people, teams, swimlanes, color rules, and tickets across TODO/ACTIVE/DONE
- [x] Add pnpm scripts: `dev`, `build`, `prisma:migrate`, `prisma:seed`
- [ ] Verify: `docker compose up -d && pnpm prisma:migrate && pnpm prisma:seed && pnpm dev` works end-to-end *(requires Postgres)*

## Milestone 2: Route Skeleton & Board CRUD ✅
- [x] `/boards` page — list all boards, create board form
- [x] `/board/[boardId]` page — empty shell with three-section layout (TODO | ACTIVE | DONE)
- [x] `/settings/[boardId]` page — empty shell with tab navigation
- [x] Server actions: `createBoard`, `renameBoard`, `deleteBoard`
- [x] Zod validation on all board mutations
- [x] Wire board CRUD UI to server actions

## Milestone 3: Ticket CRUD & Backlog ✅
- [x] Server action: `createTicket` (creates in TODO with orderKey)
- [x] Server action: `updateTicketFields` (title, description, type, assignee, team)
- [x] TODO backlog list component — renders ticket cards, supports ordering
- [x] DONE bucket list component — renders completed tickets
- [x] Ticket card component with type color badge
- [x] Zod validation on all ticket mutations
- [x] Audit events: TICKET_CREATED, TITLE_UPDATED, DESCRIPTION_UPDATED, TYPE_CHANGED, ASSIGNEE_CHANGED, TEAM_CHANGED

## Milestone 4: Board Rendering & Timer-Based Movement
- [x] Implement `computeStepIndex(startedAt, stepIntervalSeconds, maxSteps)` utility
- [x] Implement swimlane filter evaluator (AND/OR expression tree)
- [x] Implement color rule evaluator (AND/OR with stepIndex support)
- [x] ACTIVE grid component: columns = swimlanes, rows = time lanes (0..maxSteps-1)
- [x] Render rows: stepIndex 0 at bottom (newest), maxSteps-1 at top (oldest)
- [x] Client-side `setInterval` using `board.refreshIntervalSeconds` to recompute stepIndex
- [x] Group ACTIVE tickets into grid cells by (swimlane, stepIndex)
- [x] Apply color rules: first match wins, fallback to TicketType.defaultColorHex
- [x] Basic CSS transitions for row movement

## Milestone 5: Drag & Drop Flows
- [ ] Integrate dnd-kit
- [ ] DnD flow: TODO → ACTIVE (set status=ACTIVE, startedAt=now, apply onDropPatch)
- [ ] DnD flow: ACTIVE → ACTIVE (apply onDropPatch, do NOT change startedAt)
- [ ] DnD flow: ACTIVE → ACTIVE same cell reorder (update orderKey only)
- [ ] DnD flow: ACTIVE → DONE (set status=DONE, doneAt=now)
- [ ] DnD flow: DONE → TODO (set status=TODO, clear startedAt/doneAt)
- [ ] DnD flow: DONE → ACTIVE (set status=ACTIVE, startedAt=now, clear doneAt)
- [ ] Server-side onDropPatch validation: ticket must match target swimlane filter after patch
- [ ] Server action: `moveTicketToActive`, `moveTicketToDone`, `moveTicketToTodo`
- [ ] Server action: `reorderTicket`
- [ ] Audit events: STATUS_CHANGED, SWIMLANE_DROPPED, ORDER_CHANGED

## Milestone 6: Ticket Detail Panel
- [ ] Right-side slide-out panel on ticket click
- [ ] Tab 1 — Overview: title, status, type, assignee, team, timestamps
- [ ] Tab 2 — Description: markdown editor + preview
- [ ] Tab 3 — Attachments: placeholder UI ("Attachments coming soon", disabled button)
- [ ] Tab 4 — Details: audit log timeline (chronological list of human actions)
- [ ] Inline editing of ticket fields from panel, wired to `updateTicketFields`

## Milestone 7: Settings UI & Rule Builders
- [ ] Settings Tab 1 — Board: edit maxSteps, refreshIntervalSeconds
- [ ] Settings Tab 2 — Ticket Types: CRUD list + stepIntervalSeconds per type
- [ ] Settings Tab 3 — Swimlanes: CRUD + visual filter expression builder (AND/OR nested) + onDropPatch editor
- [ ] Settings Tab 4 — Color Rules: CRUD ordered list + visual expression builder
- [ ] Settings Tab 5 — People & Teams: CRUD
- [ ] Visual rule builder component: add conditions, group as AND/OR, nested
- [ ] "Advanced JSON" textarea toggle on filter/rule editors
- [ ] Zod validation on all settings mutations

## Milestone 8: Polish & Edge Cases
- [ ] Unmatched swimlane: auto-provided for tickets matching no swimlane filter
- [ ] Error handling: helpful messages when onDropPatch fails filter validation
- [ ] Board auto-refresh after mutations (revalidate + interval)
- [ ] orderKey float insertion logic (midpoint between neighbors)
- [ ] Empty states for all lists/grids
- [ ] Responsive layout basics

## Milestone 9: Playwright Smoke Tests
- [ ] Set up Playwright config
- [ ] Test: create board
- [ ] Test: create ticket in TODO
- [ ] Test: drag TODO ticket into ACTIVE swimlane → appears in grid
- [ ] Test: open ticket detail panel → audit event visible
- [ ] Test: drag ACTIVE ticket to DONE → appears in DONE bucket
- [ ] Test: drag DONE back to ACTIVE → startedAt resets, ticket at bottom row
- [ ] CI-ready test script

## Milestone 10: Documentation & Cleanup
- [ ] README with full setup instructions (pnpm i, docker compose, migrate, seed, dev)
- [ ] Document all MVP assumptions in README
- [ ] Clean up unused code, ensure consistent TypeScript strict mode
- [ ] Final review of all zod schemas and audit event coverage
