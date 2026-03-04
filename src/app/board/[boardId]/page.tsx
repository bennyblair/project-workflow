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
      project: {
        include: {
          ticketTypes: { orderBy: { createdAt: "asc" } },
        },
      },
      tickets: {
        include: {
          type: true,
          assignee: true,
          team: true,
          _count: { select: { children: true } },
        },
        orderBy: { orderKey: "asc" },
      },
      swimlanes: { orderBy: { order: "asc" } },
      colorRules: { orderBy: { order: "asc" } },
    },
  });

  if (!board) notFound();

  const todoTickets = board.tickets.filter((t) => t.status === "TODO");
  const activeTickets = board.tickets.filter((t) => t.status === "ACTIVE");
  const doneTickets = board.tickets.filter((t) => t.status === "DONE");

  // Serialize for client components
  const serializedTicketTypes = board.project.ticketTypes.map((tt) => ({
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
    filterExprJson: lane.filterExprJson,
  }));

  const serializedColorRules = board.colorRules.map((rule) => ({
    order: rule.order,
    whenExprJson: rule.whenExprJson,
    colorHex: rule.colorHex,
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
    hasParent: !!t.parentId,
    childCount: t._count.children,
  });

  const serializeActiveTicket = (t: (typeof board.tickets)[number]) => ({
    ...serializeTicket(t),
    startedAt: t.startedAt?.toISOString() ?? new Date().toISOString(),
    stepIntervalHours: t.type.stepIntervalHours,
  });

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-3">
        <Link href="/boards">
          <Button variant="ghost" size="sm">
            ← Boards
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">{board.name}</h1>
        <Link href={`/settings/${board.id}`}>
          <Button variant="ghost" size="sm">
            Settings
          </Button>
        </Link>
      </header>

      <BoardShell
        boardId={board.id}
        todoTickets={todoTickets.map(serializeTicket)}
        activeTickets={activeTickets.map(serializeActiveTicket)}
        doneTickets={doneTickets.map(serializeTicket)}
        ticketTypes={serializedTicketTypes}
        swimlanes={serializedSwimlanes}
        colorRules={serializedColorRules}
        maxSteps={board.maxSteps}
        refreshIntervalSeconds={board.refreshIntervalSeconds}
        settingsHref={`/settings/${board.id}`}
      />
    </div>
  );
}
