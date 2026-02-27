"use client";

import { useDroppable } from "@dnd-kit/core";

export type DropZoneData = {
  zone: "todo" | "active" | "done";
  swimlaneId?: string;
  stepIndex?: number;
};

type Props = {
  id: string;
  data: DropZoneData;
  children: React.ReactNode;
  className?: string;
};

export function DroppableZone({ id, data, children, className }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id, data });

  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ""} ${
        isOver ? "bg-accent/40 ring-2 ring-ring/30" : ""
      } transition-colors duration-150`}
    >
      {children}
    </div>
  );
}
