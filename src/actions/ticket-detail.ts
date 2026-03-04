"use server";

import { prisma } from "@/lib/prisma";

export type TicketDetail = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "ACTIVE" | "DONE";
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  doneAt: string | null;
  type: { id: string; name: string; key: string; defaultColorHex: string };
  assignee: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
  boardId: string;
  events: {
    id: string;
    type: string;
    dataJson: unknown;
    createdAt: string;
  }[];
  // For edit dropdowns
  availableTypes: { id: string; name: string; key: string }[];
  availablePeople: { id: string; name: string }[];
  availableTeams: { id: string; name: string }[];
};

export async function getTicketDetail(
  ticketId: string,
): Promise<TicketDetail | null> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      type: true,
      assignee: true,
      team: true,
      board: { select: { projectId: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) return null;

  // Also fetch available options for editing
  const [types, people, teams] = await Promise.all([
    prisma.ticketType.findMany({
      where: { projectId: ticket.board.projectId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, key: true },
    }),
    prisma.person.findMany({
      where: { boardId: ticket.boardId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.team.findMany({
      where: { boardId: ticket.boardId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    startedAt: ticket.startedAt?.toISOString() ?? null,
    doneAt: ticket.doneAt?.toISOString() ?? null,
    type: {
      id: ticket.type.id,
      name: ticket.type.name,
      key: ticket.type.key,
      defaultColorHex: ticket.type.defaultColorHex,
    },
    assignee: ticket.assignee
      ? { id: ticket.assignee.id, name: ticket.assignee.name }
      : null,
    team: ticket.team
      ? { id: ticket.team.id, name: ticket.team.name }
      : null,
    boardId: ticket.boardId,
    events: ticket.events.map((e) => ({
      id: e.id,
      type: e.type,
      dataJson: e.dataJson,
      createdAt: e.createdAt.toISOString(),
    })),
    availableTypes: types,
    availablePeople: people,
    availableTeams: teams,
  };
}
