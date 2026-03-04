import { prisma } from "@/lib/prisma";
import { CreateProjectForm } from "./create-project-form";
import { ProjectSection } from "./project-section";

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
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
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
    </main>
  );
}
