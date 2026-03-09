import { prisma } from "@/lib/prisma";
import { CreateProjectForm } from "./create-project-form";
import { ConveyorBelt } from "./conveyor-belt";
import { TicketBrowser } from "./ticket-browser";
import { SortableProjectList } from "./sortable-project-list";

export const dynamic = "force-dynamic";

export default async function BoardsPage() {
  const projects = await prisma.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      boards: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        include: { _count: { select: { tickets: true } } },
      },
      _count: { select: { ticketTypes: true } },
    },
  });

  return (
    <main className="relative z-[1] mx-auto max-w-7xl px-6 py-12">
      {/* RPG dialog-box title */}
      <div className="mx-auto w-fit rounded border-4 border-rpg-wood bg-rpg-parchment px-6 py-4 shadow-[4px_4px_0_#92400e]">
        <h1 className="text-center font-['Press_Start_2P'] text-xl text-rpg-brown">
          ⚔️ FLOWLINE
        </h1>
        <p className="mt-2 text-center text-xs tracking-[2px] text-rpg-dark-green">
          ~ Your Quest Log Awaits ~
        </p>
      </div>

      {/* Gold divider */}
      <div className="mx-auto my-6 h-[3px] max-w-xs rounded bg-rpg-gold" />

      {/* Conveyor belt hero */}
      <ConveyorBelt />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_minmax(0,420px)]">
        {/* Left column — Projects */}
        <div>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="font-['Press_Start_2P'] text-sm text-rpg-brown border-b-[3px] border-rpg-gold pb-1">
                🏰 PROJECTS
              </h2>
              <p className="mt-1 text-sm text-rpg-stone">
                Manage your projects and their workflow boards.
              </p>
            </div>
          </div>

          <CreateProjectForm />

          {projects.length === 0 ? (
            <p className="mt-8 text-center text-muted-foreground">
              No projects yet. Create one above to get started.
            </p>
          ) : (
            <SortableProjectList
              projects={projects.map((project) => ({
                id: project.id,
                name: project.name,
                ticketTypeCount: project._count.ticketTypes,
                boards: project.boards.map((board) => ({
                  id: board.id,
                  name: board.name,
                  ticketCount: board._count.tickets,
                  maxSteps: board.maxSteps,
                  refreshIntervalSeconds: board.refreshIntervalSeconds,
                  sortOrder: board.sortOrder,
                })),
              }))}
            />
          )}
        </div>

        {/* Right column — All Tickets */}
        {projects.length > 0 && (
          <div className="relative space-y-4 lg:sticky lg:top-6 lg:self-start rounded-md border-4 border-rpg-dark-green bg-rpg-parchment p-5 shadow-[4px_4px_0_rgba(22,101,52,0.3)]">
            <span className="absolute -top-3 right-3 text-xl">📜</span>
            <div>
              <h2 className="font-['Press_Start_2P'] text-sm text-rpg-brown border-b-[3px] border-rpg-gold pb-1">
                📜 QUEST LOG
              </h2>
              <p className="mt-1 text-xs text-rpg-stone tracking-wide">
                Search and filter quests across all boards.
              </p>
            </div>
            <TicketBrowser
              projects={projects.map((p) => ({ id: p.id, name: p.name }))}
            />
          </div>
        )}
      </div>

      {/* Gold divider */}
      <div className="mx-auto mt-12 h-[3px] max-w-xs rounded bg-rpg-gold" />
    </main>
  );
}
