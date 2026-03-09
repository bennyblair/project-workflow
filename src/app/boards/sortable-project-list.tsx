"use client";

import { useState, useEffect } from "react";
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
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ProjectSection } from "./project-section";
import { reorderProjects } from "@/actions/reorder-projects";

type Board = {
  id: string;
  name: string;
  ticketCount: number;
  maxSteps: number;
  refreshIntervalSeconds: number;
  sortOrder: number;
};

type ProjectItem = {
  id: string;
  name: string;
  ticketTypeCount: number;
  boards: Board[];
};

type Props = {
  projects: ProjectItem[];
};

export function SortableProjectList({ projects: initialProjects }: Props) {
  const [projects, setProjects] = useState(initialProjects);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(projects, oldIndex, newIndex);
    setProjects(reordered);

    const projectOrders = reordered.map((p, i) => ({ id: p.id, sortOrder: i }));
    await reorderProjects(projectOrders);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={projects.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="mt-6 space-y-8">
          {projects.map((project) => (
            <SortableProjectItem key={project.id} project={project} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableProjectItem({ project }: { project: ProjectItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag handle */}
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-4 cursor-grab active:cursor-grabbing rounded p-1 text-rpg-wood/50 hover:text-rpg-wood hover:bg-rpg-gold/10 transition-colors"
          {...attributes}
          {...listeners}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="3" r="1.5" />
            <circle cx="11" cy="3" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="13" r="1.5" />
            <circle cx="11" cy="13" r="1.5" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <ProjectSection project={project} />
        </div>
      </div>
    </div>
  );
}
