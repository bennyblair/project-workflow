import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ProjectSettingsTabs } from "./project-settings-tabs";

type Params = Promise<{ projectId: string }>;

export default async function ProjectSettingsPage({ params }: { params: Params }) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      ticketTypes: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!project) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/boards">
          <Button variant="ghost" size="sm">
            ← Back to Projects
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{project.name} — Project Settings</h1>
      </div>

      <ProjectSettingsTabs
        project={{
          id: project.id,
          name: project.name,
          ticketTypes: project.ticketTypes.map((tt) => ({
            id: tt.id,
            name: tt.name,
            key: tt.key,
            defaultColorHex: tt.defaultColorHex,
            stepIntervalSeconds: tt.stepIntervalSeconds,
          })),
        }}
      />
    </div>
  );
}
