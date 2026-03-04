import { test, expect, type Page, type Locator } from "@playwright/test";

// ---------------------------------------------------------------------------
// Smoke tests exercise the core FlowLine flows on a freshly-created board:
//   1. Create board
//   2. Create ticket in TODO
//   3. Drag TODO → ACTIVE swimlane
//   4. Open ticket detail panel → audit event visible
//   5. Drag ACTIVE → DONE
//   6. Drag DONE → ACTIVE (startedAt resets)
//
// Tests are serial — each builds on the state from the previous.
// ---------------------------------------------------------------------------

/**
 * dnd-kit uses PointerSensor which needs real pointer events.
 * Playwright's built-in `dragTo` fires mouse events but those don't always
 * trigger PointerSensor (which needs pointermove with enough distance).
 * This helper manually dispatches pointer events with sufficient steps.
 */
async function dndDrag(page: Page, source: Locator, target: Locator) {
  const srcBox = await source.boundingBox();
  const tgtBox = await target.boundingBox();
  if (!srcBox || !tgtBox) throw new Error("Could not get bounding boxes for drag");

  const srcX = srcBox.x + srcBox.width / 2;
  const srcY = srcBox.y + srcBox.height / 2;
  const tgtX = tgtBox.x + tgtBox.width / 2;
  const tgtY = tgtBox.y + tgtBox.height / 2;

  // Move to source, press, then move in steps to target, then release
  await page.mouse.move(srcX, srcY);
  await page.mouse.down();
  // Move in small steps to trigger PointerSensor's distance activation
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    const x = srcX + ((tgtX - srcX) * i) / steps;
    const y = srcY + ((tgtY - srcY) * i) / steps;
    await page.mouse.move(x, y);
    await page.waitForTimeout(50);
  }
  // Hold briefly over target
  await page.waitForTimeout(200);
  await page.mouse.up();
}

test.describe.serial("FlowLine smoke tests", () => {
  let boardId: string;
  let projectId: string;
  let boardUrl: string;
  const testProjectName = `Smoke Project ${Date.now()}`;
  const testBoardName = `Smoke Test ${Date.now()}`;
  const ticketTitle = `E2E Ticket ${Date.now()}`;

  // -----------------------------------------------------------------------
  // 1. Create project and board
  // -----------------------------------------------------------------------
  test("create a new project and board", async ({ page }) => {
    await page.goto("/boards");
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

    // Create a project first
    await page.getByTestId("project-name-input").fill(testProjectName);
    await page.getByTestId("create-project-submit").click();

    // Wait for the project section to appear
    const projectSection = page.locator("[data-testid^='project-section-']").filter({ hasText: testProjectName });
    await expect(projectSection).toBeVisible({ timeout: 10_000 });

    // Extract projectId from the project section's data-testid
    const testId = await projectSection.getAttribute("data-testid");
    projectId = testId!.replace("project-section-", "");

    // Now create a board within that project
    const boardForm = projectSection.getByTestId("create-board-form");
    await boardForm.getByTestId("board-name-input").fill(testBoardName);
    await boardForm.getByTestId("create-board-submit").click();

    // createBoard redirects to /board/<id> — wait for the board page to load
    await page.waitForURL(/\/board\//, { timeout: 15_000 });

    // Extract boardId from the URL
    const url = page.url();
    const match = url.match(/\/board\/([^/]+)/);
    expect(match).toBeTruthy();
    boardId = match![1];
    boardUrl = `/board/${boardId}`;

    // Board page should show the board name
    await expect(page.getByText(testBoardName)).toBeVisible({ timeout: 5_000 });
  });

  // -----------------------------------------------------------------------
  // 2. Create ticket in TODO
  // -----------------------------------------------------------------------
  test("create a ticket in TODO", async ({ page }) => {
    // First: configure via Settings (needs a type in project settings + catch-all swimlane in board settings)
    await setupBoardSettings(page, boardId, projectId);

    // Navigate to the board
    await page.goto(boardUrl);
    await expect(page.getByTestId("todo-backlog")).toBeVisible({ timeout: 10_000 });

    // Open the new-ticket form
    await page.getByTestId("new-ticket-btn").click();
    await expect(page.getByTestId("create-ticket-form")).toBeVisible();

    // Fill and submit
    await page.getByTestId("ticket-title-input").fill(ticketTitle);
    await page.getByTestId("create-ticket-form").locator('button[type="submit"]').click();

    // Ticket should appear in the TODO column
    await expect(
      page.getByTestId("todo-backlog").getByText(ticketTitle),
    ).toBeVisible({ timeout: 10_000 });
  });

  // -----------------------------------------------------------------------
  // 3. Drag TODO ticket into ACTIVE swimlane → appears in grid
  // -----------------------------------------------------------------------
  test("drag TODO ticket to ACTIVE swimlane", async ({ page }) => {
    await page.goto(boardUrl);

    // Wait for ticket in TODO
    const ticket = page.getByTestId("todo-backlog").getByText(ticketTitle);
    await expect(ticket).toBeVisible({ timeout: 10_000 });

    // Find an active grid drop zone (any cell)
    const dropZone = page.locator("[data-testid^='drop-zone-active-']").first();
    await expect(dropZone).toBeVisible();

    // Drag using pointer events (dnd-kit needs this)
    await dndDrag(page, ticket, dropZone);

    // Wait for the server action and refetch
    await page.waitForTimeout(3_000);
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Ticket should no longer be in TODO
    await expect(
      page.getByTestId("todo-backlog").getByText(ticketTitle),
    ).not.toBeVisible({ timeout: 5_000 });

    // Ticket should be somewhere in the active section
    const activeSection = page.locator("section").filter({ has: page.getByText("Active") });
    await expect(activeSection.getByText(ticketTitle)).toBeVisible({
      timeout: 5_000,
    });
  });

  // -----------------------------------------------------------------------
  // 4. Open ticket detail panel → audit event visible
  // -----------------------------------------------------------------------
  test("open ticket detail panel and see audit events", async ({ page }) => {
    await page.goto(boardUrl);

    // Click the ticket in the active grid
    const ticket = page.getByText(ticketTitle).first();
    await expect(ticket).toBeVisible({ timeout: 10_000 });
    await ticket.click();

    // The detail panel should slide open
    const panel = page.getByTestId("ticket-detail-panel");
    await expect(panel).toBeVisible({ timeout: 5_000 });
    await expect(panel.getByRole("heading", { name: ticketTitle })).toBeVisible({ timeout: 5_000 });

    // Audit events are visible on the Overview tab (no tab switch needed)
    await expect(panel.getByText("Ticket Created")).toBeVisible({ timeout: 5_000 });
    await expect(panel.getByText("Status Changed")).toBeVisible();
    await expect(panel.getByText("TODO → ACTIVE")).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // 5. Drag ACTIVE ticket to DONE → appears in DONE bucket
  // -----------------------------------------------------------------------
  test("drag ACTIVE ticket to DONE", async ({ page }) => {
    await page.goto(boardUrl);

    const ticket = page.getByText(ticketTitle).first();
    await expect(ticket).toBeVisible({ timeout: 10_000 });

    const doneDrop = page.getByTestId("drop-zone-done-zone");
    await expect(doneDrop).toBeVisible();

    await dndDrag(page, ticket, doneDrop);

    await page.waitForTimeout(3_000);
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Should now live in the DONE column
    await expect(
      page.getByTestId("done-bucket").getByText(ticketTitle),
    ).toBeVisible({ timeout: 10_000 });
  });

  // -----------------------------------------------------------------------
  // 6. Drag DONE back to ACTIVE → startedAt resets, ticket at bottom row
  // -----------------------------------------------------------------------
  test("drag DONE ticket back to ACTIVE", async ({ page }) => {
    await page.goto(boardUrl);

    const ticket = page.getByTestId("done-bucket").getByText(ticketTitle);
    await expect(ticket).toBeVisible({ timeout: 10_000 });

    const dropZone = page.locator("[data-testid^='drop-zone-active-']").first();
    await expect(dropZone).toBeVisible();

    await dndDrag(page, ticket, dropZone);

    await page.waitForTimeout(3_000);
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Should be gone from DONE
    await expect(
      page.getByTestId("done-bucket").getByText(ticketTitle),
    ).not.toBeVisible({ timeout: 5_000 });

    // Should be back in ACTIVE
    const activeSection = page.locator("section").filter({ has: page.getByText("Active") });
    await expect(activeSection.getByText(ticketTitle)).toBeVisible({
      timeout: 5_000,
    });

    // Open detail panel and verify there are ≥3 STATUS_CHANGED events
    await page.getByText(ticketTitle).first().click();
    const panel = page.getByTestId("ticket-detail-panel");
    await expect(panel).toBeVisible({ timeout: 5_000 });

    // Audit events are visible on the Overview tab (no tab switch needed)
    const statusEvents = panel.getByText("Status Changed");
    await expect(statusEvents.first()).toBeVisible({ timeout: 5_000 });

    // At least 3: TODO→ACTIVE, ACTIVE→DONE, DONE→ACTIVE
    const count = await statusEvents.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Helper: Set up ticket type (via project settings) + catch-all swimlane (via board settings)
// ---------------------------------------------------------------------------
async function setupBoardSettings(page: Page, boardId: string, projectId: string) {
  // ── Create a ticket type in project settings ──
  await page.goto(`/project/${projectId}/settings`);
  await page.waitForLoadState("networkidle");

  await page.getByRole("tab", { name: "Ticket Types" }).click();
  await page.getByText("+ New Type").click();

  await page.locator('input[name="name"]').first().fill("Task");
  await page.locator('input[name="key"]').first().fill("TSK");
  await page.locator('button:has-text("Create")').first().click();

  // Wait for the type to appear in the list
  await expect(page.getByText("TSK")).toBeVisible({ timeout: 10_000 });

  // ── Create a catch-all swimlane in board settings ──
  await page.goto(`/settings/${boardId}`);
  await page.waitForLoadState("networkidle");

  await page.getByRole("tab", { name: "Swimlanes" }).click();
  await page.getByText("+ New Swimlane").click();

  await page.locator('input[name="name"]').first().fill("Default");
  await page.locator('input[name="isCatchAll"]').check();
  await page.locator('button:has-text("Create")').first().click();

  // Wait for the swimlane to appear
  await expect(page.getByText("Default")).toBeVisible({ timeout: 10_000 });
}
