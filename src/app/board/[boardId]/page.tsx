import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { BoardShell } from "./board-shell";

type Params = Promise<{ boardId: string }>;

export default async function BoardPage({ params }: { params: Params }) {
  const { boardId } = await params;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      tickets: {
        include: { type: true, assignee: true, team: true },
        orderBy: { orderKey: "asc" },
      },
      ticketTypes: { orderBy: { createdAt: "asc" } },
      swimlanes: { orderBy: { order: "asc" } },
    },
  });

  if (!board) notFound();

  const todoTickets = board.tickets.filter((t) => t.status === "TODO");
  const activeTickets = board.tickets.filter((t) => t.status === "ACTIVE");
  const doneTickets = board.tickets.filter((t) => t.status === "DONE");

  // Serialize for client components
  const serializedTicketTypes = board.ticketTypes.map((tt) => ({
    id: tt.id,
    name: tt.name,
    key: tt.key,
    defaultColorHex: tt.defaultColorHex,
  }));

  const serializedSwimlanes = board.swimlanes.map((lane) => ({
    id: lane.id,
    name: lane.name,
    order: lane.order,
    isCatchAll: lane.isCatchAll,
  }));

  const serializeTicket = (t: (typeof board.tickets)[number]) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    type: { key: t.type.key, defaultColorHex: t.type.defaultColorHex },
    typeId: t.typeId,
    assignee: t.assignee ? { name: t.assignee.name } : null,
    assigneeId: t.assigneeId,
    team: t.team ? { name: t.team.name } : null,
    teamId: t.teamId,
  });

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/boards">
            <Button variant="ghost" size="sm">
              ← Boards
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">{board.name}</h1>
        </div>
        <Link href={`/settings/${board.id}`}>
          <Button variant="ghost" size="sm">
            Settings
          </Button>
        </Link>
      </header>

      <BoardShell
        boardId={board.id}
        todoTickets={todoTickets.map(serializeTicket)}
        activeTickets={activeTickets.map(serializeTicket)}
        doneTickets={doneTickets.map(serializeTicket)}
        ticketTypes={serializedTicketTypes}
        swimlanes={serializedSwimlanes}
        settingsHref={`/settings/${board.id}`}
      />
    </div>
  );
}
