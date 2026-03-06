import { prisma } from "@/lib/prisma";
import { CreateProjectForm } from "./create-project-form";
import { ProjectSection } from "./project-section";
import { ConveyorBelt } from "./conveyor-belt";
import { TicketBrowser } from "./ticket-browser";

export const dynamic = "force-dynamic";

export default async function BoardsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      boards: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { tickets: true } } },
      },
      _count: { select: { ticketTypes: true } },
    },
  });

  return (
    <main className="relative z-[1] mx-auto max-w-7xl px-6 py-12">
      {/* Neon title */}
      <h1
        className="text-center font-[Audiowide] text-4xl tracking-[6px] text-white"
        style={{
          textShadow:
            "0 0 10px oklch(0.65 0.28 340), 0 0 40px oklch(0.65 0.28 340), 0 0 80px oklch(0.65 0.28 340 / 0.4)",
        }}
      >
        FLOWLINE
      </h1>
      <p className="mt-1 text-center font-[Orbitron] text-[10px] tracking-[6px] uppercase text-neon-cyan animate-neon-pulse">
        workflow command center
      </p>

      {/* Neon divider */}
      <div
        className="mx-auto my-6 h-[2px] max-w-md rounded"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(0.65 0.28 340), oklch(0.82 0.16 195), oklch(0.82 0.24 145), transparent)",
          boxShadow:
            "0 0 8px oklch(0.65 0.28 340 / 0.3), 0 0 20px oklch(0.82 0.16 195 / 0.2)",
        }}
      />

      {/* Conveyor belt hero */}
      <ConveyorBelt />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_minmax(0,420px)]">
        {/* Left column — Projects */}
        <div>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2
                className="font-[Orbitron] text-lg font-bold tracking-[2px]"
                style={{
                  background: "linear-gradient(90deg, oklch(0.65 0.28 340), oklch(0.82 0.16 195))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ⬡ PROJECTS
              </h2>
              <p className="text-sm text-muted-foreground">
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
            <div className="mt-6 space-y-8">
              {projects.map((project) => (
                <ProjectSection
                  key={project.id}
                  project={{
                    id: project.id,
                    name: project.name,
                    ticketTypeCount: project._count.ticketTypes,
                    boards: project.boards.map((board) => ({
                      id: board.id,
                      name: board.name,
                      ticketCount: board._count.tickets,
                      maxSteps: board.maxSteps,
                      refreshIntervalSeconds: board.refreshIntervalSeconds,
                    })),
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right column — All Tickets */}
        {projects.length > 0 && (
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start rounded-2xl border border-neon-green/20 bg-card p-5" style={{ boxShadow: "0 0 15px oklch(0.82 0.24 145 / 0.05)" }}>
            <div>
              <h2
                className="font-[Orbitron] text-lg font-bold tracking-[2px]"
                style={{
                  background: "linear-gradient(90deg, oklch(0.82 0.24 145), oklch(0.82 0.16 195))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ⬡ ALL TICKETS
              </h2>
              <p className="text-xs text-muted-foreground tracking-wide">
                Search and filter tickets across all boards.
              </p>
            </div>
            <TicketBrowser
              projects={projects.map((p) => ({ id: p.id, name: p.name }))}
            />
          </div>
        )}
      </div>

      {/* Bottom neon divider */}
      <div
        className="mx-auto mt-12 h-[2px] max-w-md rounded"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(0.65 0.28 340), oklch(0.82 0.16 195), oklch(0.82 0.24 145), transparent)",
          boxShadow:
            "0 0 8px oklch(0.65 0.28 340 / 0.3), 0 0 20px oklch(0.82 0.16 195 / 0.2)",
        }}
      />
    </main>
  );
}
