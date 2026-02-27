"use client";

import { useState, useEffect, useCallback } from "react";
import { computeStepIndex, assignSwimlane, evaluateColorRules } from "@/lib/engine";
import type { FilterContext } from "@/lib/engine";
import type { ColorContext } from "@/lib/engine";
import { DraggableTicket } from "@/components/draggable-ticket";
import { DroppableZone } from "@/components/droppable-zone";

type ActiveTicket = {
  id: string;
  title: string;
  typeId: string;
  type: { key: string; defaultColorHex: string };
  assignee: { name: string } | null;
  assigneeId: string | null;
  team: { name: string } | null;
  teamId: string | null;
  startedAt: string; // ISO string
  stepIntervalSeconds: number;
};

type Swimlane = {
  id: string;
  name: string;
  order: number;
  isCatchAll: boolean;
  filterExprJson: unknown;
};

type ColorRule = {
  order: number;
  whenExprJson: unknown;
  colorHex: string;
};

type Props = {
  tickets: ActiveTicket[];
  swimlanes: Swimlane[];
  colorRules: ColorRule[];
  maxSteps: number;
  refreshIntervalSeconds: number;
  settingsHref: string;
};

type GridCell = {
  swimlaneId: string;
  stepIndex: number;
  tickets: (ActiveTicket & { resolvedColor: string })[];
};

function buildFilterContext(ticket: ActiveTicket): FilterContext {
  return {
    typeId: ticket.typeId,
    teamId: ticket.teamId,
    assigneeId: ticket.assigneeId,
    status: "ACTIVE",
    title: ticket.title,
    description: null,
    "type.key": ticket.type.key,
    "team.name": ticket.team?.name,
    "assignee.name": ticket.assignee?.name,
  };
}

function buildColorContext(ticket: ActiveTicket, stepIndex: number): ColorContext {
  return {
    typeId: ticket.typeId,
    teamId: ticket.teamId,
    assigneeId: ticket.assigneeId,
    status: "ACTIVE",
    title: ticket.title,
    description: null,
    stepIndex,
    "type.key": ticket.type.key,
    "team.name": ticket.team?.name,
    "assignee.name": ticket.assignee?.name,
  };
}

export function ActiveGrid({
  tickets,
  swimlanes,
  colorRules,
  maxSteps,
  refreshIntervalSeconds,
  settingsHref,
}: Props) {
  const computeGrid = useCallback(() => {
    const cells = new Map<string, GridCell>();

    // Initialize all cells
    for (const lane of swimlanes) {
      for (let step = 0; step < maxSteps; step++) {
        const key = `${lane.id}:${step}`;
        cells.set(key, { swimlaneId: lane.id, stepIndex: step, tickets: [] });
      }
    }

    // Place tickets
    for (const ticket of tickets) {
      const stepIndex = computeStepIndex(
        ticket.startedAt,
        ticket.stepIntervalSeconds,
        maxSteps,
      );

      const filterCtx = buildFilterContext(ticket);
      const laneId = assignSwimlane(swimlanes, filterCtx);
      if (!laneId) continue; // unmatched — would need auto "Unmatched" lane

      const colorCtx = buildColorContext(ticket, stepIndex);
      const resolvedColor = evaluateColorRules(
        colorRules,
        colorCtx,
        ticket.type.defaultColorHex,
      );

      const key = `${laneId}:${stepIndex}`;
      const cell = cells.get(key);
      if (cell) {
        cell.tickets.push({ ...ticket, resolvedColor });
      }
    }

    return cells;
  }, [tickets, swimlanes, colorRules, maxSteps]);

  const [grid, setGrid] = useState(() => computeGrid());
  const [tick, setTick] = useState(0);

  // Recompute grid on every tick
  useEffect(() => {
    setGrid(computeGrid());
  }, [computeGrid, tick]);

  // Client-side refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, refreshIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [refreshIntervalSeconds]);

  if (swimlanes.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No swimlanes configured.{" "}
          <a href={settingsHref} className="underline">
            Add swimlanes in settings
          </a>
        </p>
      </div>
    );
  }

  // Rows: maxSteps-1 at top (oldest) → 0 at bottom (newest)
  const rowIndices = Array.from({ length: maxSteps }, (_, i) => maxSteps - 1 - i);

  return (
    <div className="flex-1 overflow-auto">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 grid border-b bg-background"
        style={{
          gridTemplateColumns: `4rem repeat(${swimlanes.length}, minmax(180px, 1fr))`,
        }}
      >
        <div className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground">
          Step
        </div>
        {swimlanes.map((lane) => (
          <div
            key={lane.id}
            className="border-l px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {lane.name}
            {lane.isCatchAll && (
              <span className="ml-1 text-[10px] font-normal opacity-60">
                (catch-all)
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      {rowIndices.map((stepIdx) => (
        <div
          key={stepIdx}
          className="grid border-b transition-all duration-500 ease-in-out"
          style={{
            gridTemplateColumns: `4rem repeat(${swimlanes.length}, minmax(180px, 1fr))`,
            minHeight: "3.5rem",
          }}
        >
          {/* Row label */}
          <div className="flex items-center justify-center border-r px-2 text-xs font-mono text-muted-foreground">
            {stepIdx}
          </div>

          {/* Cells */}
          {swimlanes.map((lane) => {
            const cell = grid.get(`${lane.id}:${stepIdx}`);
            const cellId = `active-${lane.id}-${stepIdx}`;
            return (
              <DroppableZone
                key={lane.id}
                id={cellId}
                data={{ zone: "active", swimlaneId: lane.id, stepIndex: stepIdx }}
                className="border-l p-1.5"
              >
                {cell && cell.tickets.length > 0 && (
                  <div className="space-y-1.5">
                    {cell.tickets.map((ticket) => (
                      <DraggableTicket
                        key={ticket.id}
                        id={ticket.id}
                        data={{
                          ticketId: ticket.id,
                          sourceZone: "active",
                          sourceSwimlaneId: lane.id,
                        }}
                      >
                        <div
                          className="rounded-md border p-2 shadow-sm transition-all duration-500 ease-in-out"
                          style={{
                            borderLeftColor: ticket.resolvedColor,
                            borderLeftWidth: "3px",
                          }}
                        >
                          <div className="mb-0.5 flex items-center gap-1.5">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: ticket.resolvedColor }}
                            />
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              {ticket.type.key}
                            </span>
                            {ticket.team && (
                              <span className="ml-auto text-[10px] text-muted-foreground">
                                {ticket.team.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium leading-snug">
                            {ticket.title}
                          </p>
                          {ticket.assignee && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              {ticket.assignee.name}
                            </p>
                          )}
                        </div>
                      </DraggableTicket>
                    ))}
                  </div>
                )}
              </DroppableZone>
            );
          })}
        </div>
      ))}
    </div>
  );
}
