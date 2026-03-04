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
    <Card data-testid={`project-section-${project.id}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">{project.name}</CardTitle>
          <CardDescription>
            {project.boards.length} board{project.boards.length !== 1 && "s"} ·{" "}
            {project.ticketTypeCount} ticket type{project.ticketTypeCount !== 1 && "s"}
          </CardDescription>
        </div>
        <Link href={`/project/${project.id}/settings`}>
          <Button variant="ghost" size="sm">
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
