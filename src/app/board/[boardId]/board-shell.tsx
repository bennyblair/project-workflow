"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { TodoBacklog } from "@/components/todo-backlog";
import { DoneBucket } from "@/components/done-bucket";
import { ActiveGrid } from "@/components/active-grid";
import { TicketCard } from "@/components/ticket-card";
import { TicketDetailPanel } from "@/components/ticket-detail-panel";
import type { DragData } from "@/components/draggable-ticket";
import type { DropZoneData } from "@/components/droppable-zone";
import {
  moveTicketToActive,
  moveActiveToSwimlane,
  moveTicketToDone,
  moveTicketToTodo,
} from "@/actions/move-ticket";

type SerializedTicket = {
  id: string;
  title: string;
  description: string | null;
  type: { key: string; defaultColorHex: string };
  typeId: string;
  assignee: { name: string } | null;
  assigneeId: string | null;
  team: { name: string } | null;
  teamId: string | null;
  hasParent: boolean;
  childCount: number;
};

type ActiveTicket = SerializedTicket & {
  startedAt: string;
  stepIntervalHours: number;
};

type Swimlane = {
  id: string;
  name: string;
  order: number;
  isCatchAll: boolean;
  filterExprJson: unknown;
};

type TicketType = {
  id: string;
  name: string;
  key: string;
  defaultColorHex: string;
};

type ColorRule = {
  order: number;
  whenExprJson: unknown;
  colorHex: string;
};

type Props = {
  boardId: string;
  todoTickets: SerializedTicket[];
  activeTickets: ActiveTicket[];
  doneTickets: SerializedTicket[];
  ticketTypes: TicketType[];
  swimlanes: Swimlane[];
  colorRules: ColorRule[];
  maxSteps: number;
  refreshIntervalSeconds: number;
  settingsHref: string;
};

export function BoardShell({
  boardId,
  todoTickets,
  activeTickets,
  doneTickets,
  ticketTypes,
  swimlanes,
  colorRules,
  maxSteps,
  refreshIntervalSeconds,
  settingsHref,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const router = useRouter();

  // Auto-refresh board data from server on interval
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, refreshIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [router, refreshIntervalSeconds]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Find the ticket being dragged for the overlay
  const allTickets = [
    ...todoTickets.map((t) => ({ ...t, zone: "todo" as const })),
    ...activeTickets.map((t) => ({ ...t, zone: "active" as const })),
    ...doneTickets.map((t) => ({ ...t, zone: "done" as const })),
  ];
  const draggedTicket = activeId
    ? allTickets.find((t) => t.id === activeId)
    : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setError(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const dragData = active.data.current as DragData | undefined;
      const dropData = over.data.current as DropZoneData | undefined;
      if (!dragData || !dropData) return;

      const ticketId = dragData.ticketId;
      const sourceZone = dragData.sourceZone;
      const targetZone = dropData.zone;

      // Same zone, no swimlane change → ignore (or reorder — not implemented for MVP)
      if (sourceZone === targetZone && targetZone !== "active") return;

      startTransition(async () => {
        let result: { success: boolean; error?: string };

        if (targetZone === "active") {
          const swimlaneId = dropData.swimlaneId;
          if (!swimlaneId) return;

          if (sourceZone === "active") {
            // ACTIVE → ACTIVE: swimlane move
            if (dragData.sourceSwimlaneId === swimlaneId) return; // same cell
            result = await moveActiveToSwimlane(ticketId, swimlaneId);
          } else {
            // TODO → ACTIVE or DONE → ACTIVE
            result = await moveTicketToActive(ticketId, swimlaneId);
          }
        } else if (targetZone === "done") {
          if (sourceZone === "done") return; // already done
          if (sourceZone === "active") {
            result = await moveTicketToDone(ticketId);
          } else {
            // TODO → DONE not in spec, ignore
            return;
          }
        } else if (targetZone === "todo") {
          if (sourceZone === "todo") return; // already todo
          if (sourceZone === "done" || sourceZone === "active") {
            result = await moveTicketToTodo(ticketId);
          } else {
            return;
          }
        } else {
          return;
        }

        if (!result.success && result.error) {
          setError(result.error);
        }
      });
    },
    [startTransition],
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 overflow-hidden">
        {/* TODO column */}
        <TodoBacklog
          boardId={boardId}
          tickets={todoTickets}
          ticketTypes={ticketTypes}
          onTicketClick={setSelectedTicketId}
        />

        {/* ACTIVE grid */}
        <section className="flex flex-1 flex-col">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Active
            </h2>
            <span className="text-xs text-muted-foreground">
              {activeTickets.length} ticket{activeTickets.length !== 1 && "s"} ·{" "}
              {swimlanes.length} swimlane{swimlanes.length !== 1 && "s"} ·{" "}
              {maxSteps} steps · {refreshIntervalSeconds}s refresh
              {isPending && " · Saving…"}
            </span>
            {error && (
              <p className="mt-1 text-xs text-destructive">{error}</p>
            )}
          </div>
          <ActiveGrid
            tickets={activeTickets}
            swimlanes={swimlanes}
            colorRules={colorRules}
            maxSteps={maxSteps}
            refreshIntervalSeconds={refreshIntervalSeconds}
            settingsHref={settingsHref}
            onTicketClick={setSelectedTicketId}
          />
        </section>

        {/* DONE column */}
        <DoneBucket tickets={doneTickets} onTicketClick={setSelectedTicketId} />
      </div>

      {/* Drag overlay — renders the dragged ticket above everything */}
      <DragOverlay dropAnimation={null}>
        {draggedTicket ? (
          <div className="w-64 opacity-90">
            <TicketCard
              ticket={draggedTicket}
              variant={draggedTicket.zone === "done" ? "done" : "default"}
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* Ticket detail slide-out panel */}
      <TicketDetailPanel
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
      />
    </DndContext>
  );
}
