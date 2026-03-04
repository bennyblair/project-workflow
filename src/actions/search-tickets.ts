"use server";

import { prisma } from "@/lib/prisma";

export type SearchTicketResult = {
  id: string;
  title: string;
  status: string;
  boardName: string;
  type: { key: string; defaultColorHex: string };
};

/**
 * Search tickets within a project by title (case-insensitive).
 * Excludes the given ticket ID (so you can't parent a ticket to itself).
 */
export async function searchTickets(
  projectId: string,
  query: string,
  excludeTicketId: string,
): Promise<SearchTicketResult[]> {
  const tickets = await prisma.ticket.findMany({
    where: {
      board: { projectId },
      id: { not: excludeTicketId },
      title: { contains: query, mode: "insensitive" },
    },
    include: {
      type: { select: { key: true, defaultColorHex: true } },
      board: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return tickets.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    boardName: t.board.name,
    type: { key: t.type.key, defaultColorHex: t.type.defaultColorHex },
  }));
}
