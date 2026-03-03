"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { evaluateFilter, assignSwimlane } from "@/lib/engine/filter-evaluator";
import type { FilterExpr, FilterContext } from "@/lib/engine/filter-evaluator";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

type MoveResult = { success: boolean; error?: string };

/** Build a FilterContext from ticket data + optional overrides from onDropPatch */
function buildFilterCtx(
  ticket: {
    typeId: string;
    teamId: string | null;
    assigneeId: string | null;
    status: string;
    title: string;
    description: string | null;
    type: { key: string };
    team: { name: string } | null;
    assignee: { name: string } | null;
  },
  overrides: Record<string, unknown> = {},
): FilterContext {
  const merged = { ...ticket, ...overrides };
  return {
    typeId: (merged.typeId as string) ?? null,
    teamId: (merged.teamId as string) ?? null,
    assigneeId: (merged.assigneeId as string) ?? null,
    status: (merged.status as string) ?? ticket.status,
    title: (merged.title as string) ?? ticket.title,
    description: (merged.description as string) ?? ticket.description,
    "type.key": ticket.type?.key,
    "team.name": ticket.team?.name,
    "assignee.name": ticket.assignee?.name,
  };
}

/** Compute orderKey at the end of a given status bucket. */
async function nextOrderKey(boardId: string, status: "TODO" | "ACTIVE" | "DONE"): Promise<number> {
  const last = await prisma.ticket.findFirst({
    where: { boardId, status },
    orderBy: { orderKey: "desc" },
    select: { orderKey: true },
  });
  return (last?.orderKey ?? 0) + 1000;
}

// ---------------------------------------------------------------------------
// moveTicketToActive — TODO → ACTIVE  or  DONE → ACTIVE
// ---------------------------------------------------------------------------

export async function moveTicketToActive(
  ticketId: string,
  targetSwimlaneId: string,
): Promise<MoveResult> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { type: true, assignee: true, team: true },
  });
  if (!ticket) return { success: false, error: "Ticket not found" };
  if (ticket.status === "ACTIVE" && !ticket.doneAt) {
    // Already active — this is a swimlane move, not a status move
    return moveActiveToSwimlane(ticketId, targetSwimlaneId);
  }

  // ── Smart Swimlane Snap ──────────────────────────────────────────────────
  // Check if the ticket already matches a swimlane based on current fields.
  // If so, snap to that lane instead of applying the drop-target's onDropPatch.
  const allSwimlanes = await prisma.swimlane.findMany({
    where: { boardId: ticket.boardId },
    orderBy: { order: "asc" },
    select: { id: true, name: true, filterExprJson: true, isCatchAll: true, onDropPatchJson: true },
  });

  const ticketCtx = buildFilterCtx(ticket, { status: "ACTIVE" });
  const matchedLaneId = assignSwimlane(
    allSwimlanes.filter((l) => !l.isCatchAll), // exclude catch-all from smart snap
    ticketCtx,
  );

  // Determine which swimlane to use and whether to apply a patch
  let effectiveSwimlane: typeof allSwimlanes[number] | undefined;
  let patch: Record<string, unknown> = {};
  let snapped = false;

  if (matchedLaneId) {
    // Ticket already matches a lane — snap to it, no patch needed
    effectiveSwimlane = allSwimlanes.find((l) => l.id === matchedLaneId);
    snapped = true;
  } else {
    // Ticket doesn't match any lane — use the drop-target and apply its onDropPatch
    effectiveSwimlane = allSwimlanes.find((l) => l.id === targetSwimlaneId);
    if (!effectiveSwimlane) return { success: false, error: "Swimlane not found" };
    patch = (effectiveSwimlane.onDropPatchJson ?? {}) as Record<string, unknown>;
  }

  if (!effectiveSwimlane) return { success: false, error: "Swimlane not found" };

  // Build the data update: status, startedAt, clear doneAt, optionally apply onDropPatch
  const updateData: Record<string, unknown> = {
    ...patch,
    status: "ACTIVE",
    startedAt: new Date(),
    doneAt: null,
  };

  // Validate that the ticket will match the effective swimlane filter after patching
  if (!effectiveSwimlane.isCatchAll && !snapped) {
    const ctx = buildFilterCtx(ticket, { ...patch, status: "ACTIVE" });
    const expr = effectiveSwimlane.filterExprJson as FilterExpr;
    if (!evaluateFilter(expr, ctx)) {
      const patchFields = Object.keys(patch);
      const fieldHint = patchFields.length > 0
        ? ` The patch sets: ${patchFields.map((k) => `${k}=${JSON.stringify(patch[k])}`).join(", ")}.`
        : " This swimlane has no onDropPatch configured — add one in Settings.";
      return {
        success: false,
        error: `Ticket would not match swimlane "${effectiveSwimlane.name}" filter after applying patch.${fieldHint} Check the swimlane filter expression in Settings.`,
      };
    }
  }

  const orderKey = await nextOrderKey(ticket.boardId, "ACTIVE");

  const fromStatus = ticket.status;
  await prisma.$transaction([
    prisma.ticket.update({
      where: { id: ticketId },
      data: { ...updateData, orderKey },
    }),
    prisma.auditEvent.create({
      data: {
        ticketId,
        type: "STATUS_CHANGED",
        dataJson: { from: fromStatus, to: "ACTIVE" },
      },
    }),
    // Audit: record swimlane assignment (either snap or patch)
    ...(snapped
      ? [
          prisma.auditEvent.create({
            data: {
              ticketId,
              type: "SWIMLANE_DROPPED",
              dataJson: {
                swimlaneName: effectiveSwimlane.name,
                snapped: true,
              },
            },
          }),
        ]
      : Object.keys(patch).length > 0
        ? [
            prisma.auditEvent.create({
              data: {
                ticketId,
                type: "SWIMLANE_DROPPED",
                dataJson: {
                  swimlaneName: effectiveSwimlane.name,
                  patch: JSON.parse(JSON.stringify(patch)) as Record<string, string>,
                },
              },
            }),
          ]
        : []),
  ]);

  revalidatePath(`/board/${ticket.boardId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// moveActiveToSwimlane — ACTIVE → ACTIVE (different swimlane)
// ---------------------------------------------------------------------------

export async function moveActiveToSwimlane(
  ticketId: string,
  targetSwimlaneId: string,
): Promise<MoveResult> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { type: true, assignee: true, team: true },
  });
  if (!ticket) return { success: false, error: "Ticket not found" };
  if (ticket.status !== "ACTIVE") {
    return { success: false, error: "Ticket is not ACTIVE" };
  }

  const swimlane = await prisma.swimlane.findUnique({
    where: { id: targetSwimlaneId },
  });
  if (!swimlane) return { success: false, error: "Swimlane not found" };

  const patch = (swimlane.onDropPatchJson ?? {}) as Record<string, unknown>;

  // Validate the ticket will match the target swimlane after patch
  if (!swimlane.isCatchAll) {
    const ctx = buildFilterCtx(ticket, patch);
    const expr = swimlane.filterExprJson as FilterExpr;
    if (!evaluateFilter(expr, ctx)) {
      const patchFields = Object.keys(patch);
      const fieldHint = patchFields.length > 0
        ? ` The patch sets: ${patchFields.map((k) => `${k}=${JSON.stringify(patch[k])}`).join(", ")}.`
        : " This swimlane has no onDropPatch configured — add one in Settings.";
      return {
        success: false,
        error: `Ticket would not match swimlane "${swimlane.name}" filter after applying patch.${fieldHint} Check the swimlane filter expression in Settings.`,
      };
    }
  }

  // Do NOT change startedAt!
  if (Object.keys(patch).length > 0) {
    await prisma.$transaction([
      prisma.ticket.update({
        where: { id: ticketId },
        data: patch,
      }),
      prisma.auditEvent.create({
        data: {
          ticketId,
          type: "SWIMLANE_DROPPED",
          dataJson: {
            swimlaneName: swimlane.name,
            patch: JSON.parse(JSON.stringify(patch)) as Record<string, string>,
          },
        },
      }),
    ]);
  }

  revalidatePath(`/board/${ticket.boardId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// moveTicketToDone — ACTIVE → DONE
// ---------------------------------------------------------------------------

export async function moveTicketToDone(
  ticketId: string,
): Promise<MoveResult> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true, boardId: true },
  });
  if (!ticket) return { success: false, error: "Ticket not found" };
  if (ticket.status !== "ACTIVE") {
    return { success: false, error: "Only ACTIVE tickets can be moved to DONE" };
  }

  const orderKey = await nextOrderKey(ticket.boardId, "DONE");

  await prisma.$transaction([
    prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "DONE", doneAt: new Date(), orderKey },
    }),
    prisma.auditEvent.create({
      data: {
        ticketId,
        type: "STATUS_CHANGED",
        dataJson: { from: "ACTIVE", to: "DONE" },
      },
    }),
  ]);

  revalidatePath(`/board/${ticket.boardId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// moveTicketToTodo — DONE → TODO
// ---------------------------------------------------------------------------

export async function moveTicketToTodo(
  ticketId: string,
): Promise<MoveResult> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true, boardId: true },
  });
  if (!ticket) return { success: false, error: "Ticket not found" };
  if (ticket.status !== "DONE") {
    return { success: false, error: "Only DONE tickets can be moved to TODO" };
  }

  const orderKey = await nextOrderKey(ticket.boardId, "TODO");

  await prisma.$transaction([
    prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "TODO",
        startedAt: null,
        doneAt: null,
        orderKey,
      },
    }),
    prisma.auditEvent.create({
      data: {
        ticketId,
        type: "STATUS_CHANGED",
        dataJson: { from: "DONE", to: "TODO" },
      },
    }),
  ]);

  revalidatePath(`/board/${ticket.boardId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// reorderTicket — update orderKey for within-cell reordering
// Ready for use when drag-to-reorder UI is added within grid cells.
// Use midpointOrderKey() from @/lib/engine to compute the new orderKey.
// ---------------------------------------------------------------------------

export async function reorderTicket(
  ticketId: string,
  newOrderKey: number,
): Promise<MoveResult> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, boardId: true },
  });
  if (!ticket) return { success: false, error: "Ticket not found" };

  await prisma.$transaction([
    prisma.ticket.update({
      where: { id: ticketId },
      data: { orderKey: newOrderKey },
    }),
    prisma.auditEvent.create({
      data: {
        ticketId,
        type: "ORDER_CHANGED",
        dataJson: { orderKey: newOrderKey },
      },
    }),
  ]);

  revalidatePath(`/board/${ticket.boardId}`);
  return { success: true };
}
