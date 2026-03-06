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
      className="relative overflow-hidden border-neon-pink/30 bg-card backdrop-blur-sm"
      style={{ boxShadow: "0 0 15px oklch(0.65 0.28 340 / 0.08), inset 0 1px 0 rgba(255,255,255,0.05)" }}
    >
      {/* Neon edge glow overlay */}
      <div
        className="pointer-events-none absolute inset-[-1px] rounded-xl"
        style={{
          padding: "1px",
          background: "linear-gradient(135deg, oklch(0.65 0.28 340), transparent 40%, transparent 60%, oklch(0.82 0.16 195))",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-[Orbitron] text-base font-bold text-white">{project.name}</CardTitle>
          <CardDescription>
            {project.boards.length} board{project.boards.length !== 1 && "s"} ·{" "}
            {project.ticketTypeCount} ticket type{project.ticketTypeCount !== 1 && "s"}
          </CardDescription>
        </div>
        <Link href={`/project/${project.id}/settings`}>
          <Button variant="ghost" size="sm" className="text-neon-cyan hover:text-neon-cyan/80">
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
