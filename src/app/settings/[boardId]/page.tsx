import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SettingsTabs } from "./settings-tabs";

type Params = Promise<{ boardId: string }>;

export default async function SettingsPage({ params }: { params: Params }) {
  const { boardId } = await params;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      ticketTypes: { orderBy: { createdAt: "asc" } },
      teams: { orderBy: { createdAt: "asc" } },
      people: { orderBy: { createdAt: "asc" } },
      swimlanes: { orderBy: { order: "asc" } },
      colorRules: { orderBy: { order: "asc" } },
    },
  });

  if (!board) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/board/${board.id}`}>
          <Button variant="ghost" size="sm">
            ← Back to Board
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{board.name} — Settings</h1>
      </div>

      <SettingsTabs board={board} />
    </div>
  );
}
