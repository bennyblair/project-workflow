# FlowLine — Technical Decisions & Assumptions

Document of every non-obvious decision, trade-off, and assumption made during planning.
Updated as implementation progresses.

---

## 1. Next.js 16 Availability

**Decision:** If Next.js 16 is not yet stable/released at time of implementation, use the latest Next.js 15.x canary or stable with App Router. The architecture (App Router, Server Actions, RSC) is identical.

**Rationale:** The spec calls for Next.js 16 + React 19. If 16 isn't available, 15.x with React 19 support provides the same APIs.

## 2. IDs: CUID vs UUID vs Auto-Increment

**Decision:** Use `cuid()` (Prisma `@default(cuid())`) for all primary keys.

**Rationale:** URL-safe, sortable-ish, no collision risk, works well with Prisma. UUIDs are fine too but CUIDs are shorter in URLs like `/board/[boardId]`.

## 3. orderKey Float Precision

**Decision:** Use `Float` type in Prisma (maps to `double precision` in Postgres). Insert new items at the midpoint between neighbors (e.g., between 1.0 and 2.0 → 1.5).

**Rationale:** Floats give ~15 significant digits, allowing hundreds of midpoint insertions before precision loss. If precision degrades, a background rebalance (renumber 1.0, 2.0, 3.0…) can be triggered. This is acceptable for MVP.

**Edge case:** When inserting at the start, use `existingMin - 1.0`. When inserting at the end, use `existingMax + 1.0`. When list is empty, start at `1.0`.

## 4. stepIndex Is Computed, Not Stored

**Decision:** `stepIndex` is a derived value computed client-side. It is NOT stored in the database.

**Rationale:** Spec explicitly states: compute via `clamp(floor((now - startedAt) / stepIntervalSeconds), 0, maxSteps-1)`. Storing it would require a cron job to keep in sync. Client-side computation with `setInterval` is simpler and matches the spec's "no server cron" requirement.

## 5. Swimlane Membership Is Derived, Not Stored

**Decision:** Tickets do NOT have a `swimlaneId` column. Swimlane assignment is computed at render time by evaluating filters in order.

**Rationale:** Spec explicitly says "Do NOT store swimlaneId on ticket for MVP." This means a ticket's swimlane can change if filters or ticket fields change — no migration needed.

**Trade-off:** Every render must evaluate all swimlane filters for each ACTIVE ticket. Acceptable for MVP scale (likely <1000 tickets per board).

## 6. Filter Expression Evaluation

**Decision:** Implement a recursive evaluator for the JSON expression tree format specified. Evaluate in TypeScript on both client (for rendering) and server (for onDropPatch validation).

**Shared module:** Create `lib/filters/evaluate.ts` usable in both environments.

**Supported operators:**
- String fields: EQ, NEQ, CONTAINS, NOT_CONTAINS, IN
- Numeric fields (stepIndex only): EQ, GTE, LTE, GT, LT
- Groups: AND, OR with nested children

## 7. onDropPatch Validation Strategy

**Decision:** When a ticket is dropped into a swimlane:
1. Apply `onDropPatchJson` to the ticket fields (server-side, in a transaction).
2. Re-evaluate the target swimlane's `filterExprJson` against the patched ticket.
3. If the ticket doesn't match, **rollback** the transaction and return an error.

**Rationale:** Spec says "validate that the ticket now matches the target swimlane's filter; if not, reject and return a helpful error."

## 8. Type Change While ACTIVE

**Decision:** If a ticket's `typeId` changes while status is ACTIVE, the `stepIndex` will jump because it's recomputed with the new type's `stepIntervalHours`. No special handling — document as MVP behavior.

**Example:** A ticket active for 2 hours with Bug (1hr interval) is at stepIndex 2. If changed to Feature (4hr interval), it jumps to stepIndex 0. This is expected MVP behavior.

## 9. Audit Log Scope

**Decision:** Only human-initiated actions are logged. Timer-driven stepIndex changes are NOT audit events.

**Logged events:** TICKET_CREATED, STATUS_CHANGED, TITLE_UPDATED, DESCRIPTION_UPDATED, TYPE_CHANGED, ASSIGNEE_CHANGED, TEAM_CHANGED, PARENT_CHANGED, SWIMLANE_DROPPED, ORDER_CHANGED.

**dataJson format:** Each event stores a JSON blob with `before`/`after` values where applicable (e.g., `{ "before": "TODO", "after": "ACTIVE" }` for STATUS_CHANGED).

## 10. Auth Preparation (No Auth in MVP)

**Decision:** No authentication in MVP. All actions are treated as admin.

**Preparation:** Server actions accept an optional `actorId` parameter (defaults to a hardcoded "system" user). Audit events have a `createdBy` concept in `dataJson`. When auth is added later, swap the hardcoded ID for a session-based user.

## 11. Markdown Editor

**Decision:** Use a simple `<textarea>` with a preview toggle for description editing. No rich WYSIWYG editor.

**Rationale:** MVP scope. A `react-markdown` renderer for preview is sufficient. Can upgrade to a proper editor (e.g., Milkdown, TipTap) later.

## 12. Database Strategy

**Decision:** Single PostgreSQL instance via docker-compose. No connection pooling for MVP.

**Prisma client:** Singleton pattern in `lib/prisma.ts` to avoid connection exhaustion in dev (Next.js hot reload creates multiple instances).

## 13. Refresh & Real-time Strategy

**Decision:** Client-side `setInterval` for auto-movement rendering. After mutations, call `router.refresh()` to revalidate server data.

**No WebSockets/SSE:** Single-user POC doesn't need real-time sync. The interval + mutation refresh pattern is sufficient.

## 14. Folder Structure

```
project-workflow/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Redirect to /boards
│   │   ├── boards/
│   │   │   └── page.tsx                # Board list + create
│   │   ├── board/
│   │   │   └── [boardId]/
│   │   │       └── page.tsx            # Main board view
│   │   └── settings/
│   │       └── [boardId]/
│   │           └── page.tsx            # Board settings
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── board/
│   │   │   ├── TodoBacklog.tsx
│   │   │   ├── ActiveGrid.tsx
│   │   │   ├── DoneBucket.tsx
│   │   │   ├── TicketCard.tsx
│   │   │   └── TicketDetailPanel.tsx
│   │   ├── settings/
│   │   │   ├── BoardSettingsTab.tsx
│   │   │   ├── TicketTypesTab.tsx
│   │   │   ├── SwimlanesTab.tsx
│   │   │   ├── ColorRulesTab.tsx
│   │   │   └── PeopleTeamsTab.tsx
│   │   └── shared/
│   │       ├── FilterExprBuilder.tsx
│   │       └── JsonEditorToggle.tsx
│   ├── lib/
│   │   ├── prisma.ts                   # Singleton client
│   │   ├── filters/
│   │   │   ├── evaluate.ts             # Expression tree evaluator
│   │   │   └── types.ts                # FilterExpr, Condition types
│   │   ├── colors/
│   │   │   └── resolve.ts              # Color rule resolver
│   │   ├── time/
│   │   │   └── stepIndex.ts            # stepIndex computation
│   │   └── validation/
│   │       └── schemas.ts              # Zod schemas
│   ├── actions/
│   │   ├── board.ts                    # Board CRUD server actions
│   │   ├── ticket.ts                   # Ticket mutations
│   │   └── settings.ts                 # Settings mutations
│   └── types/
│       └── index.ts                    # Shared TypeScript types
├── tests/
│   └── smoke.spec.ts                   # Playwright smoke tests
├── docker-compose.yml
├── .env.example
├── playwright.config.ts
├── SPEC.md
├── IMPLEMENTATION_PLAN.md
├── TECH_DECISIONS.md
└── README.md
```

## 15. pnpm Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "prisma:migrate": "prisma migrate dev",
  "prisma:seed": "prisma db seed",
  "prisma:studio": "prisma studio",
  "test": "playwright test",
  "lint": "next lint"
}
```

## 16. Step Interval in Hours (Not Seconds)

**Decision:** Renamed `stepIntervalSeconds` to `stepIntervalHours` across the entire codebase. The field stores an integer (1–24) representing hours. The engine multiplies by 3600 internally when computing stepIndex.

**Rationale:** The minimum interval was already 1 hour, and users configure in hours via the UI. Storing raw seconds created a mismatch between the UI (hours) and the database (seconds). Using hours directly is simpler and less error-prone.

## 17. Filter Operator Case Insensitivity

**Decision:** The filter evaluator normalizes `operator` to uppercase (via `.toUpperCase()`) before the switch statement. The `FilterCondition.operator` type was changed from a strict union to `string`.

**Rationale:** Swimlane filter expressions stored by the expression builder used lowercase operators (e.g., `"eq"`) while the evaluator's switch cases used uppercase (`"EQ"`). This caused cross-swimlane drag-and-drop to fail with "ticket would not match swimlane filter" errors. Normalizing to uppercase at evaluation time handles all cases.

## 18. Parent-Child Ticket Relationships

**Decision:** Tickets have an optional `parentId` (self-referential FK with `onDelete: SetNull`). Parent-child is a simple one-to-many relationship. No depth limit or circular reference prevention at the DB level.

**Rationale:** MVP feature to support basic hierarchy (epics/stories/subtasks pattern). Circular reference prevention would require recursive queries or application-level validation — deferred to a later milestone. `onDelete: SetNull` ensures deleting a parent gracefully unlinks children rather than cascading deletion.

**Search:** The `searchTickets` action queries across all boards in the project using case-insensitive title matching, limited to 20 results. This keeps the link-parent dialog responsive without complex search infrastructure.

**UI:** The LinkParentDialog uses `@radix-ui/react-dialog` (same foundation as Sheet) with debounced search (300ms) to avoid excessive server calls while typing.
