"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BoardCard } from "./board-card";
import { CreateBoardForm } from "./create-board-form";

type Board = {
  id: string;
  name: string;
  ticketCount: number;
  maxSteps: number;
  refreshIntervalSeconds: number;
};

type ProjectSectionProps = {
  project: {
    id: string;
    name: string;
    ticketTypeCount: number;
    boards: Board[];
  };
};

export function ProjectSection({ project }: ProjectSectionProps) {
  return (
    <Card
      data-testid={`project-section-${project.id}`}
      className="relative overflow-hidden border-4 border-rpg-wood bg-rpg-parchment"
      style={{ boxShadow: "4px 4px 0 rgba(146,64,14,0.3)" }}
    >
      {/* Diamond decorator */}
      <div className="pointer-events-none absolute -top-1.5 left-3 bg-rpg-parchment px-1 font-['Press_Start_2P'] text-[10px] text-rpg-gold">◆</div>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-['Press_Start_2P'] text-xs text-rpg-brown">{project.name}</CardTitle>
          <CardDescription>
            {project.boards.length} board{project.boards.length !== 1 && "s"} ·{" "}
            {project.ticketTypeCount} ticket type{project.ticketTypeCount !== 1 && "s"}
          </CardDescription>
        </div>
        <Link href={`/project/${project.id}/settings`}>
          <Button variant="ghost" size="sm" className="text-rpg-dark-green hover:text-rpg-dark-green/80">
            Project Settings
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <CreateBoardForm projectId={project.id} />

        {project.boards.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No boards yet. Create one above.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {project.boards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
