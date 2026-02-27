"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export type DragData = {
  ticketId: string;
  sourceZone: "todo" | "active" | "done";
  sourceSwimlaneId?: string;
};

type Props = {
  id: string;
  data: DragData;
  children: React.ReactNode;
};

export function DraggableTicket({ id, data, children }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, data });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : undefined,
    cursor: "grab",
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}
