import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

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
      swimlanes: { orderBy: { order: "asc" } },
    },
  });

  if (!board) notFound();

  const todoTickets = board.tickets.filter((t) => t.status === "TODO");
  const activeTickets = board.tickets.filter((t) => t.status === "ACTIVE");
  const doneTickets = board.tickets.filter((t) => t.status === "DONE");

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

      {/* Three-section layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* TODO column */}
        <section className="flex w-64 flex-shrink-0 flex-col border-r bg-muted/30">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Todo
            </h2>
            <span className="text-xs text-muted-foreground">
              {todoTickets.length} ticket{todoTickets.length !== 1 && "s"}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {todoTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-lg border bg-card p-3 shadow-sm"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: ticket.type.defaultColorHex }}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      {ticket.type.key}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{ticket.title}</p>
                  {ticket.assignee && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ticket.assignee.name}
                    </p>
                  )}
                </div>
              ))}
              {todoTickets.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No todo tickets
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ACTIVE grid */}
        <section className="flex flex-1 flex-col">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Active
            </h2>
            <span className="text-xs text-muted-foreground">
              {activeTickets.length} ticket{activeTickets.length !== 1 && "s"} ·{" "}
              {board.swimlanes.length} swimlane{board.swimlanes.length !== 1 && "s"}
            </span>
          </div>
          <div className="flex-1 overflow-auto p-3">
            {board.swimlanes.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No swimlanes configured.{" "}
                <Link
                  href={`/settings/${board.id}`}
                  className="underline"
                >
                  Add swimlanes in settings
                </Link>
              </p>
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${board.swimlanes.length}, minmax(200px, 1fr))` }}>
                {/* Column headers */}
                {board.swimlanes.map((lane) => (
                  <div
                    key={lane.id}
                    className="rounded-t-lg bg-muted/50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {lane.name}
                  </div>
                ))}
                {/* Ticket cells — stepIndex frozen at 0 for now */}
                {board.swimlanes.map((lane) => (
                  <div key={lane.id} className="space-y-2">
                    {activeTickets
                      .filter((t) => t.teamId === (lane.isCatchAll ? t.teamId : undefined) || !lane.isCatchAll)
                      .map((ticket) => (
                        <div
                          key={ticket.id}
                          className="rounded-lg border bg-card p-3 shadow-sm"
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: ticket.type.defaultColorHex }}
                            />
                            <span className="text-xs font-medium text-muted-foreground">
                              {ticket.type.key}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{ticket.title}</p>
                          {ticket.assignee && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {ticket.assignee.name}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* DONE column */}
        <section className="flex w-64 flex-shrink-0 flex-col border-l bg-muted/30">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Done
            </h2>
            <span className="text-xs text-muted-foreground">
              {doneTickets.length} ticket{doneTickets.length !== 1 && "s"}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {doneTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-lg border bg-card p-3 opacity-70 shadow-sm"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: ticket.type.defaultColorHex }}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      {ticket.type.key}
                    </span>
                  </div>
                  <p className="text-sm font-medium line-through">
                    {ticket.title}
                  </p>
                  {ticket.assignee && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ticket.assignee.name}
                    </p>
                  )}
                </div>
              ))}
              {doneTickets.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No completed tickets
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
