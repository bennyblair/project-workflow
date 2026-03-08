"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BoardCard } from "./board-card";
import { CreateBoardForm } from "./create-board-form";
import { reorderBoards } from "@/actions/reorder-boards";

type Board = {
  id: string;
  name: string;
  ticketCount: number;
  maxSteps: number;
  refreshIntervalSeconds: number;
  sortOrder: number;
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
  const [boards, setBoards] = useState<Board[]>(project.boards);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = boards.findIndex((b) => b.id === active.id);
    const newIndex = boards.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(boards, oldIndex, newIndex);
    setBoards(reordered);

    // Persist new order
    const boardOrders = reordered.map((b, i) => ({ id: b.id, sortOrder: i }));
    await reorderBoards(boardOrders);
  }

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
            {boards.length} board{boards.length !== 1 && "s"} ·{" "}
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

        {boards.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No boards yet. Create one above.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={boards.map((b) => b.id)}
              strategy={rectSortingStrategy}
            >
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {boards.map((board) => (
                  <SortableBoardCard key={board.id} board={board} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}

function SortableBoardCard({ board }: { board: Board }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: board.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BoardCard board={board} />
    </div>
  );
}
