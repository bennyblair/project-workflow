# FlowLine — Product Specification

You are a senior full-stack engineer. Build an MVP web app "FlowLine" inspired by Jira, with multiple boards and a production-line style ACTIVE board where tickets automatically move upward over time (horizontal lanes), while users can drag tickets across swimlanes (columns) without overriding time.

## SCOPE / ASSUMPTIONS (LOCK THESE IN)
- Single-user local POC (no auth). Treat all actions as admin. Structure code so auth/roles can be added later.
- **Projects** are the top-level entity. Each project contains one or more boards.
- **Ticket types are project-scoped** — defined once per project and shared across all boards in that project.
- Multiple boards within a project: create, rename, delete.
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

## PROJECTS & BOARDS
- /boards (home page) shows **projects** with their sub-boards. Each project section lists its boards and allows creating new boards within it.
- A **Create Project** form allows creating new projects.
- Projects show a Settings link to **/project/[projectId]/settings** for project-level configuration (ticket types).
- Board cards show Open and Settings buttons only — **no rename or delete** on the home page (these actions live in /settings/[boardId]).
- /board/[boardId] is the main board view.
- /settings/[boardId] configures that board (rename, delete, swimlanes, color rules, people & teams — but NOT ticket types).
- /project/[projectId]/settings configures project-level settings (ticket types).

## BOARD LAYOUT (MAIN VIEW)
Header: board name is **centered** in the header bar, with a back button on the left and settings on the right.

Three sections:
1) LEFT: TODO backlog list (vertical list of ticket cards)
2) CENTER: ACTIVE grid
   - Columns = Swimlanes (customizable definitions using filters)
   - Rows = Time lanes (horizontal) computed by time steps (0..maxSteps-1)
   - Top row = oldest, bottom row = newest
   - **Step rows have a color gradient**: step 0 (bottom, newest) = green, middle steps = yellow, last step (top, oldest) = red. The gradient is applied as a subtle row background.
3) RIGHT: DONE bucket list

## TIME / AUTO-MOVEMENT (MOST IMPORTANT)
- Tickets only move when status = ACTIVE.
- When a ticket first enters ACTIVE: set startedAt = now. createdAt is immutable.
- Movement speed is PER TICKET TYPE:
  - Each TicketType has stepIntervalHours (integer, 1–24).
  - **Minimum step interval is 1 hour.** The UI and validation must enforce this.
  - Settings UI displays hours directly for step interval configuration.
- Compute stepIndex for rendering:
  - if status != ACTIVE: stepIndex = null
  - else stepIndex = clamp(floor((now - startedAt) / (stepIntervalHours × 3600)), 0, maxSteps-1)
- Render rows so that stepIndex 0 is bottom (newest) and maxSteps-1 is top (oldest).
- The UI must recompute stepIndex periodically:
  - Board setting refreshIntervalSeconds (default 5)
  - Use setInterval on the client to re-render movement.

### NOTE ON TYPE CHANGES (MVP DECISION)
- If a ticket's type changes while ACTIVE, stepIndex will be recomputed using the new type's stepIntervalHours (ticket may "jump" rows). Document this as an MVP assumption.

## DRAG & DROP RULES (DO NOT OVERRIDE TIME)
- Dragging must NEVER change startedAt and must NEVER allow user to choose row directly.
- Allowed actions:
  1) TODO -> ACTIVE:
     - Drop a TODO ticket into a swimlane column on ACTIVE grid.
     - **Smart swimlane snap**: If the ticket already has an assignment (teamId, assigneeId, or typeId) that matches an existing swimlane filter, the server IGNORES the drop-target swimlane and instead places the ticket in its correct swimlane (the first swimlane whose filter matches the ticket's current fields). If the ticket is unassigned (no fields match any swimlane), the drop-target swimlane's onDropPatch is applied as normal.
     - Server updates: status=ACTIVE, startedAt=now
     - Also apply swimlane.onDropPatch (see swimlanes) to set fields like type/team/assignee — only when smart snap does not override.
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
     - **Smart swimlane snap** also applies (same logic as TODO → ACTIVE).
- Ordering:
  - Use orderKey (float) for stable ordering within a list/cell and easy inserts.
  - Only applies within the same (status, swimlane, stepIndex) view.

## SMART SWIMLANE SNAP (DETAILED)
When a ticket enters the ACTIVE grid (from TODO or DONE):
1. Build a FilterContext from the ticket's current fields (before any patch).
2. Evaluate all swimlanes in order to find the first match.
3. If a match is found (ticket already belongs to a swimlane based on its existing fields):
   - Place the ticket in that swimlane. Do NOT apply the drop-target's onDropPatch.
   - The user's drop location is overridden — the ticket "snaps" to its correct lane.
4. If no match is found (ticket is unassigned / doesn't match any lane):
   - Apply the drop-target swimlane's onDropPatch as before.
   - Validate the ticket now matches the target swimlane's filter.

This enables two UX patterns:
- **Unassigned tickets**: Drop into "Frontend" lane → ticket gets teamId set → appears in Frontend.
- **Pre-assigned tickets**: Ticket already has teamId=Frontend → drop anywhere on board → it automatically snaps to the Frontend swimlane.

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
- parentId (optional, self-referential — links to another Ticket)
- status (TODO|ACTIVE|DONE)
- createdAt (immutable)
- startedAt (nullable)
- doneAt (nullable)
- orderKey (float)

(Do NOT store swimlaneId on ticket for MVP; swimlane membership is derived from filters.)

## PARENT-CHILD TICKET RELATIONSHIPS
- Any ticket can have a **parent** ticket (optional, self-referential via `parentId`).
- A parent ticket can have multiple **children** (one-to-many).
- When viewing a ticket in the detail panel:
  - If a parent is set, it is shown with a link to view the parent ticket and an "Unlink" button.
  - Child tickets are listed below with type badge, title, and status.
  - A "Link Parent" button opens a search dialog.
- **Link Parent Dialog**:
  - Searches tickets within the same **project** (across all boards) by title.
  - Debounced search input (300ms).
  - Results show type color/key, title, status badge, and board name.
  - The current ticket is excluded from search results.
  - Selecting a result sets it as the parent.
- Unlinking a parent sets `parentId` to null.
- Both link and unlink actions generate a `PARENT_CHANGED` audit event.

## TICKET DETAIL PANEL
- Clicking a ticket opens a right-side panel with tabs:
  1) Overview: title, status, type, assignee, team, createdAt, startedAt, doneAt, **parent section** (view/link/unlink parent, children list), **description section** (inline editor), then **audit log timeline** below.
  2) Attachments: UI only placeholder ("Attachments coming soon"), show an "Add attachment" button disabled or no-op.
- Description is NOT a separate tab — it lives in the Overview tab between the field rows and the audit log.
- Parent section shows the linked parent (if any) or a "Link Parent" button. Children are listed below.

## AUDIT LOG (HUMAN ACTIONS ONLY)
Append-only audit_events:
- TICKET_CREATED
- STATUS_CHANGED (TODO<->ACTIVE<->DONE, reopen)
- TITLE_UPDATED
- DESCRIPTION_UPDATED
- TYPE_CHANGED
- ASSIGNEE_CHANGED
- TEAM_CHANGED
- PARENT_CHANGED (parent linked or unlinked)
- SWIMLANE_DROPPED (ticket dragged into another swimlane)
- ORDER_CHANGED (reordered within a list/cell)

No auto-move events.

## DATA MODEL (Prisma)

### Project
- id, name
- createdAt, updatedAt

### Board
- id, **projectId**, name
- maxSteps (default 10)
- refreshIntervalSeconds (default 5)

### TicketType
- id, **projectId**, name, key, defaultColorHex, stepIntervalHours (integer, 1–24, default 1)
- Unique on **(projectId, key)** — same key can exist in different projects

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
- parentId nullable (self-referential FK to Ticket, onDelete: SetNull)
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
- createProject, updateProject, deleteProject
- createBoard(projectId, name), renameBoard, deleteBoard
- createTicket (creates in TODO backlog; must require a typeId — show error if no ticket types exist)
- updateTicketFields (title, description, type, assignee, team, parentId)
- searchTickets(projectId, query, excludeTicketId) — search by title across project for parent linking
- moveTicketToActive(boardId, ticketId, targetSwimlaneId)
- moveTicketToDone(boardId, ticketId)
- moveTicketToTodo(boardId, ticketId)
- reorderTicket(ticketId, contextKey, newOrderKey)
- Ticket type CRUD is scoped to **projectId** (not boardId)

Each mutation must:
- validate input with zod
- write audit event
- for moveTicketToActive / swimlane drop: apply onDropPatch + validate filter match
- for cross-swimlane moves: **resolve entity names** from patch IDs (teamId → team.name, etc.) before evaluating filter expressions

## BOARD RENDERING
- Load board config, swimlanes, color rules, types, teams, people, and tickets.
- For ACTIVE tickets compute stepIndex client-side using startedAt and (type.stepIntervalHours × 3600).
- Determine swimlane membership by evaluating swimlane filters in order.
- Group tickets into:
  - TODO list
  - DONE list
  - ACTIVE grid cells by (swimlane, stepIndex)
- Recompute on interval tick and after any mutation.
- Provide smooth UI transitions when items shift rows (basic CSS transitions acceptable).

## SETTINGS UI

### Board Settings (/settings/[boardId])
Tabs:
1) Board: name, maxSteps, refreshIntervalSeconds (plus rename/delete)
2) Swimlanes: CRUD + filter editor + onDropPatch editor + **drag-and-drop reordering** (order reflects on the board)
3) Color Rules: CRUD ordered list + expression editor
4) People & Teams: CRUD

### Project Settings (/project/[projectId]/settings)
Tabs:
1) Project: project name
2) Ticket Types: CRUD + stepIntervalHours per type (shared across all project boards)

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
    - 1 project ("Engineering") with 2 boards
    - Ticket types defined at **project level** with different speeds (e.g. Bug=1hr, Task=2hr, Feature=4hr)
    - people/teams (per board)
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
