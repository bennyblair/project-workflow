import { prisma } from "@/lib/prisma";
import { CreateBoardForm } from "./create-board-form";
import { BoardCard } from "./board-card";

export const dynamic = "force-dynamic";

export default async function BoardsPage() {
  const boards = await prisma.board.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { tickets: true } } },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Boards</h1>
          <p className="text-muted-foreground">
            Manage your workflow boards.
          </p>
        </div>
      </div>

      <CreateBoardForm />

      {boards.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">
          No boards yet. Create one above to get started.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={{
                id: board.id,
                name: board.name,
                ticketCount: board._count.tickets,
                maxSteps: board.maxSteps,
                refreshIntervalSeconds: board.refreshIntervalSeconds,
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
