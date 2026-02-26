# FlowLine — Product Specification

You are a senior full-stack engineer. Build an MVP web app "FlowLine" inspired by Jira, with multiple boards and a production-line style ACTIVE board where tickets automatically move upward over time (horizontal lanes), while users can drag tickets across swimlanes (columns) without overriding time.

## SCOPE / ASSUMPTIONS (LOCK THESE IN)
- Single-user local POC (no auth). Treat all actions as admin. Structure code so auth/roles can be added later.
- Multiple boards: create, rename, delete.
- Attachments: UI only (button/tab exists, shows placeholder). No upload/storage logic.
- No audit logging of automatic movement; only log human actions.
- Board auto-refreshes client-side on a timer to reflect movement (no server cron/job).
- Swimlane filters and color rules must support AND + OR (nested groups).

## TECH STACK (use exactly this)
- Next.js 16 App Router + React 19 + TypeScript
- PostgreSQL + Prisma ORM
- TailwindCSS + shadcn/ui
- dnd-kit for drag/drop
- zod for validation
- pnpm
- docker-compose for local Postgres
- Playwright smoke tests

## CORE DOMAIN
Ticket Status:
- TODO (Backlog): tickets live in a left backlog list; do NOT auto-move.
- ACTIVE (On-board): tickets appear in the center board grid; DO auto-move upward over time.
- DONE: tickets move to the right Done bucket; do NOT auto-move.

Reopen:
- DONE tickets can be dragged back to TODO or ACTIVE.
- If reopened to ACTIVE, startedAt resets to now (time restarts).

## MULTI-BOARD
- /boards page lists boards and allows create.
- /board/[boardId] is the main board view.
- /settings/[boardId] configures that board.

## BOARD LAYOUT (MAIN VIEW)
Three sections:
1) LEFT: TODO backlog list (vertical list of ticket cards)
2) CENTER: ACTIVE grid
   - Columns = Swimlanes (customizable definitions using filters)
   - Rows = Time lanes (horizontal) computed by time steps (0..maxSteps-1)
   - Top row = oldest, bottom row = newest
3) RIGHT: DONE bucket list

## TIME / AUTO-MOVEMENT (MOST IMPORTANT)
- Tickets only move when status = ACTIVE.
- When a ticket first enters ACTIVE: set startedAt = now. createdAt is immutable.
- Movement speed is PER TICKET TYPE:
  - Each TicketType has stepIntervalSeconds.
- Compute stepIndex for rendering:
  - if status != ACTIVE: stepIndex = null
  - else stepIndex = clamp(floor((now - startedAt) / stepIntervalSeconds), 0, maxSteps-1)
- Render rows so that stepIndex 0 is bottom (newest) and maxSteps-1 is top (oldest).
- The UI must recompute stepIndex periodically:
  - Board setting refreshIntervalSeconds (default 5)
  - Use setInterval on the client to re-render movement.

### NOTE ON TYPE CHANGES (MVP DECISION)
- If a ticket's type changes while ACTIVE, stepIndex will be recomputed using the new type's interval (ticket may "jump" rows). Document this as an MVP assumption.

## DRAG & DROP RULES (DO NOT OVERRIDE TIME)
- Dragging must NEVER change startedAt and must NEVER allow user to choose row directly.
- Allowed actions:
  1) TODO -> ACTIVE:
     - Drop a TODO ticket into a swimlane column on ACTIVE grid.
     - Server updates: status=ACTIVE, startedAt=now
     - Also apply swimlane.onDropPatch (see swimlanes) to set fields like type/team/assignee.
  2) ACTIVE -> ACTIVE:
     - Drag horizontally into another swimlane column.
     - Server updates: apply swimlane.onDropPatch (do NOT change startedAt)
     - Allow manual ordering within the same cell (same swimlane + same stepIndex)
  3) ACTIVE -> DONE:
     - Drop into DONE bucket.
     - Server updates: status=DONE, doneAt=now
  4) DONE -> TODO:
     - Server updates: status=TODO, startedAt=null, doneAt=null
  5) DONE -> ACTIVE:
     - Server updates: status=ACTIVE, startedAt=now, doneAt=null
- Ordering:
  - Use orderKey (float) for stable ordering within a list/cell and easy inserts.
  - Only applies within the same (status, swimlane, stepIndex) view.

## SWIMLANES (COLUMNS) — FILTERS + PATCHES
Goal:
- Swimlanes can represent "assigned to Ben", "type = Bug", "team = X", etc.
- Swimlanes are defined by FILTERS (AND/OR). Tickets displayed in the first matching swimlane by order.

Swimlane has:
- name
- order (int)
- filterExprJson (expression tree, AND/OR supported)
- onDropPatchJson (partial update that is applied when dropping a ticket into this lane)
- optional: isCatchAll boolean for a final "Other/Unmatched" lane

How tickets are assigned to swimlanes at render:
- Evaluate swimlanes in ascending order.
- The first swimlane whose filterExprJson matches the ticket gets the ticket.
- If none matches, ticket goes to an automatically-provided "Unmatched" lane.

When dropping into a swimlane:
- Apply that swimlane's onDropPatchJson to the ticket (server-side) so it will match the lane filter going forward.
- After applying patch, validate that the ticket now matches the target swimlane's filter; if not, reject and return a helpful error.

## FILTER EXPRESSION FORMAT (AND/OR)
Use a JSON expression tree like:
- Group:
  { "op": "AND" | "OR", "children": [Expr, Expr, ...] }
- Condition:
  { "field": "typeId|teamId|assigneeId|status|title|description",
    "operator": "EQ|NEQ|CONTAINS|NOT_CONTAINS|IN",
    "value": string | string[] }

For ACTIVE-only conditions (color rules), allow computed field:
- stepIndex (number) with operators: GTE, LTE, GT, LT, EQ

## COLORING RULES (ORDERED, AND/OR)
- Implement rule-based coloring per board.
- Ordered list of ColorRules; first match wins.
- If no rule matches, fall back to TicketType.defaultColorHex.

ColorRule has:
- order
- whenExprJson (same expression format; allow stepIndex comparisons)
- colorHex

Examples:
- IF (typeId EQ Bug) AND (stepIndex GTE 6) => #FF0000
- IF (teamId EQ Payments) OR (title CONTAINS "SEV") => #FFA500

## TICKET FIELDS
- title (required)
- description (markdown, optional)
- typeId (required)
- assigneeId (optional)
- teamId (optional)
- status (TODO|ACTIVE|DONE)
- createdAt (immutable)
- startedAt (nullable)
- doneAt (nullable)
- orderKey (float)

(Do NOT store swimlaneId on ticket for MVP; swimlane membership is derived from filters.)

## TICKET DETAIL PANEL
- Clicking a ticket opens a right-side panel with tabs:
  1) Overview: title, status, type, assignee, team, createdAt, startedAt, doneAt
  2) Description: markdown editor + preview
  3) Attachments: UI only placeholder ("Attachments coming soon"), show an "Add attachment" button disabled or no-op.
  4) Details: audit log timeline

## AUDIT LOG (HUMAN ACTIONS ONLY)
Append-only audit_events:
- TICKET_CREATED
- STATUS_CHANGED (TODO<->ACTIVE<->DONE, reopen)
- TITLE_UPDATED
- DESCRIPTION_UPDATED
- TYPE_CHANGED
- ASSIGNEE_CHANGED
- TEAM_CHANGED
- SWIMLANE_DROPPED (ticket dragged into another swimlane)
- ORDER_CHANGED (reordered within a list/cell)

No auto-move events.

## DATA MODEL (Prisma)

### Board
- id, name
- maxSteps (default 10)
- refreshIntervalSeconds (default 5)

### TicketType
- id, boardId, name, key, defaultColorHex, stepIntervalSeconds

### Team
- id, boardId, name

### Person
- id, boardId, name

### Swimlane
- id, boardId, name, order
- filterExprJson (Json)
- onDropPatchJson (Json)

### ColorRule
- id, boardId, order
- whenExprJson (Json)
- colorHex

### Ticket
- id, boardId
- title, description
- typeId
- assigneeId nullable
- teamId nullable
- status
- orderKey (float)
- createdAt, updatedAt
- startedAt nullable
- doneAt nullable

### AuditEvent
- id, ticketId
- type
- dataJson (Json)
- createdAt

## SERVER ACTIONS / MUTATIONS (Next.js)
- createBoard, renameBoard, deleteBoard
- createTicket (creates in TODO backlog)
- updateTicketFields (title, description, type, assignee, team)
- moveTicketToActive(boardId, ticketId, targetSwimlaneId)
- moveTicketToDone(boardId, ticketId)
- moveTicketToTodo(boardId, ticketId)
- reorderTicket(ticketId, contextKey, newOrderKey)

Each mutation must:
- validate input with zod
- write audit event
- for moveTicketToActive / swimlane drop: apply onDropPatch + validate filter match

## BOARD RENDERING
- Load board config, swimlanes, color rules, types, teams, people, and tickets.
- For ACTIVE tickets compute stepIndex client-side using startedAt and type.stepIntervalSeconds.
- Determine swimlane membership by evaluating swimlane filters in order.
- Group tickets into:
  - TODO list
  - DONE list
  - ACTIVE grid cells by (swimlane, stepIndex)
- Recompute on interval tick and after any mutation.
- Provide smooth UI transitions when items shift rows (basic CSS transitions acceptable).

## SETTINGS UI (/settings/[boardId])
Tabs:
1) Board: maxSteps, refreshIntervalSeconds
2) Ticket Types: CRUD + stepIntervalSeconds
3) Swimlanes: CRUD + filter editor + onDropPatch editor
4) Color Rules: CRUD ordered list + expression editor
5) People & Teams: CRUD

## EDITORS (MVP UI)
- Build a simple visual rule builder:
  - Users can add conditions and group them as AND/OR (nested).
- Also provide an "Advanced JSON" textarea toggle for filters and rules for power users.

## DEV EXPERIENCE
- Provide:
  - docker-compose.yml for Postgres
  - .env.example
  - Prisma migrations
  - Seed:
    - 2 boards
    - types with different speeds (e.g. Bug=60s, Task=180s, Feature=300s for easy demo)
    - people/teams
    - swimlanes (e.g. "Bugs", "Ben", "Team A", "Unmatched")
    - color rules examples
    - tickets across TODO/ACTIVE/DONE
  - README with setup:
    - pnpm i
    - docker compose up -d
    - pnpm prisma:migrate
    - pnpm prisma:seed
    - pnpm dev

## TESTING (Playwright smoke)
- create board
- create ticket in TODO
- drag TODO ticket into an ACTIVE swimlane
- verify it appears in ACTIVE grid
- open ticket detail panel and verify audit event exists
- drag to DONE and verify it appears in DONE
- drag DONE back to ACTIVE and verify startedAt resets (ticket returns to bottom row)

## DELIVERABLE
- Working Next.js repo implementing above with clean TypeScript, strong typing, and documented assumptions.
- If anything remains ambiguous, make a reasonable MVP choice and document in README under "Assumptions".

## IMPLEMENTATION ORDER
1. Scaffold Next.js + Prisma + migrations + seed + /boards + /board/[id] + /settings/[id]
2. Implement board rendering with timer-based movement
3. Drag/drop flows + audit log
4. Settings tabs + rule builders
5. Playwright tests
