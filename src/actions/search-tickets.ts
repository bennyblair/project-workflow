"use server";

import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SearchTicketResult = {
  id: string;
  title: string;
  status: string;
  boardName: string;
  type: { key: string; defaultColorHex: string };
  assignee: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
};

export type TicketSearchFilters = {
  status?: string;
  typeId?: string;
  boardId?: string;
  teamId?: string;
  assigneeId?: string;
};

export type FilterOption = {
  types: { id: string; name: string; key: string; defaultColorHex: string }[];
  boards: { id: string; name: string }[];
  teams: { id: string; name: string }[];
  assignees: { id: string; name: string }[];
};

// ---------------------------------------------------------------------------
// Filter options for a project (types, boards, teams, people)
// ---------------------------------------------------------------------------

export async function getProjectFilterOptions(
  projectId: string,
): Promise<FilterOption> {
  const [types, boards, teams, assignees] = await Promise.all([
    prisma.ticketType.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, key: true, defaultColorHex: true },
    }),
    prisma.board.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
    prisma.team.findMany({
      where: { board: { projectId } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.person.findMany({
      where: { board: { projectId } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return { types, boards, teams, assignees };
}

// ---------------------------------------------------------------------------
// Search tickets within a project with optional filters
// ---------------------------------------------------------------------------

/**
 * Search tickets within a project by title (case-insensitive) with optional
 * filter dimensions: status, typeId, boardId, teamId, assigneeId.
 * Set excludeTicketId to "" or omit when no exclusion is needed.
 */
export async function searchTickets(
  projectId: string,
  query: string,
  excludeTicketId: string,
  filters?: TicketSearchFilters,
): Promise<SearchTicketResult[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    board: { projectId },
  };

  if (excludeTicketId) {
    where.id = { not: excludeTicketId };
  }

  if (query) {
    where.title = { contains: query, mode: "insensitive" };
  }

  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.typeId) {
    where.typeId = filters.typeId;
  }
  if (filters?.boardId) {
    where.boardId = filters.boardId;
  }
  if (filters?.teamId) {
    where.teamId = filters.teamId;
  }
  if (filters?.assigneeId) {
    where.assigneeId = filters.assigneeId;
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      type: { select: { key: true, defaultColorHex: true } },
      board: { select: { name: true } },
      assignee: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return tickets.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    boardName: t.board.name,
    type: { key: t.type.key, defaultColorHex: t.type.defaultColorHex },
    assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name } : null,
    team: t.team ? { id: t.team.id, name: t.team.name } : null,
  }));
}
