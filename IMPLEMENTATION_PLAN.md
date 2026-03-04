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
- [x] Integrate dnd-kit
- [x] DnD flow: TODO → ACTIVE (set status=ACTIVE, startedAt=now, apply onDropPatch)
- [x] DnD flow: ACTIVE → ACTIVE (apply onDropPatch, do NOT change startedAt)
- [x] DnD flow: ACTIVE → ACTIVE same cell reorder (update orderKey only)
- [x] DnD flow: ACTIVE → DONE (set status=DONE, doneAt=now)
- [x] DnD flow: DONE → TODO (set status=TODO, clear startedAt/doneAt)
- [x] DnD flow: DONE → ACTIVE (set status=ACTIVE, startedAt=now, clear doneAt)
- [x] Server-side onDropPatch validation: ticket must match target swimlane filter after patch
- [x] Server action: `moveTicketToActive`, `moveTicketToDone`, `moveTicketToTodo`
- [x] Server action: `reorderTicket`
- [x] Audit events: STATUS_CHANGED, SWIMLANE_DROPPED, ORDER_CHANGED

## Milestone 6: Ticket Detail Panel
- [x] Right-side slide-out panel on ticket click
- [x] Tab 1 — Overview: title, status, type, assignee, team, timestamps
- [x] Tab 2 — Description: markdown editor + preview
- [x] Tab 3 — Attachments: placeholder UI ("Attachments coming soon", disabled button)
- [x] Tab 4 — Details: audit log timeline (chronological list of human actions)
- [x] Inline editing of ticket fields from panel, wired to `updateTicketFields`

## Milestone 7: Settings UI & Rule Builders
- [x] Settings Tab 1 — Board: edit maxSteps, refreshIntervalSeconds
- [x] Settings Tab 2 — Ticket Types: CRUD list + stepIntervalSeconds per type
- [x] Settings Tab 3 — Swimlanes: CRUD + visual filter expression builder (AND/OR nested) + onDropPatch editor
- [x] Settings Tab 4 — Color Rules: CRUD ordered list + visual expression builder
- [x] Settings Tab 5 — People & Teams: CRUD
- [x] Visual rule builder component: add conditions, group as AND/OR, nested
- [x] "Advanced JSON" textarea toggle on filter/rule editors
- [x] Zod validation on all settings mutations

## Milestone 8: Polish & Edge Cases ✅
- [x] Unmatched swimlane: auto-provided for tickets matching no swimlane filter
- [x] Error handling: helpful messages when onDropPatch fails filter validation
- [x] Board auto-refresh after mutations (revalidate + interval)
- [x] orderKey float insertion logic (midpoint between neighbors)
- [x] Empty states for all lists/grids
- [x] Responsive layout basics

## Milestone 9: Playwright Smoke Tests ✅
- [x] Set up Playwright config
- [x] Test: create board
- [x] Test: create ticket in TODO
- [x] Test: drag TODO ticket into ACTIVE swimlane → appears in grid
- [x] Test: open ticket detail panel → audit event visible
- [x] Test: drag ACTIVE ticket to DONE → appears in DONE bucket
- [x] Test: drag DONE back to ACTIVE → startedAt resets, ticket at bottom row
- [x] CI-ready test script

## Milestone 10: Documentation & Cleanup ✅
- [x] README with full setup instructions (pnpm i, docker compose, migrate, seed, dev)
- [x] Document all MVP assumptions in README
- [x] Clean up unused code, ensure consistent TypeScript strict mode
- [x] Final review of all zod schemas and audit event coverage

## Milestone 11: Smart Swimlane Snap ✅
- [x] Update `moveTicketToActive` to detect pre-assigned tickets (teamId/assigneeId/typeId matching a lane filter)
- [x] If ticket already matches a swimlane, snap to that lane instead of applying drop-target's onDropPatch
- [x] If ticket is unassigned (no lane match), fall back to existing onDropPatch behavior
- [x] Same logic for DONE → ACTIVE (reopen) path
- [x] Add audit event noting the snap (SWIMLANE_DROPPED with snap indicator)
- [x] Update SPEC.md with smart snap rules
- [x] Update README with smart snap behavior
- [x] Verify existing Playwright tests still pass

## Milestone 12: 1-Hour Minimum Step Intervals ✅
- [x] Update Zod schemas: min(3600) for stepIntervalSeconds (create + update)
- [x] Update settings UI: display as hours, enforce minimum 1 hour
- [x] Update seed data: use 3600/5400/7200/10800/14400 instead of 60/90/120/180/300
- [x] Update SPEC.md with minimum interval requirement
- [x] Update README documentation
- [x] Verify typecheck + build pass

## Milestone 13: UI/UX Polish & Refinements ✅
- [x] Center board name in board page header
- [x] Remove delete and rename buttons from board cards on /boards home page
- [x] Add step row color gradient: green (step 0) → yellow (middle) → red (last step)
- [x] Fix ticket creation bug: handle missing typeId when no ticket types exist
- [x] Swimlane drag-and-drop reordering in settings (with server action to persist order)
- [x] Move description + audit log into Overview tab (remove separate Description and Details tabs)
- [x] Update SPEC.md, README, IMPLEMENTATION_PLAN
- [x] Verify typecheck + Playwright tests pass
