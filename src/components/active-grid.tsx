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
  stepIntervalHours: number;
  hasParent: boolean;
  childCount: number;
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
  onTicketClick?: (ticketId: string) => void;
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

const UNMATCHED_LANE_ID = "__unmatched__";

/**
 * Compute a row background color on a green → yellow → red gradient.
 * step 0 (newest) = green, middle = yellow, maxSteps-1 (oldest) = red.
 * Returns an rgba color with low opacity for a subtle tint.
 */
function stepRowColor(stepIndex: number, maxSteps: number): string {
  if (maxSteps <= 1) return "rgba(239, 68, 68, 0.08)"; // single step = red
  const t = stepIndex / (maxSteps - 1); // 0 = newest (green), 1 = oldest (red)
  // Green (120°) → Yellow (60°) → Red (0°)
  const hue = 120 * (1 - t);
  return `hsla(${hue}, 80%, 50%, 0.07)`;
}

export function ActiveGrid({
  tickets,
  swimlanes,
  colorRules,
  maxSteps,
  refreshIntervalSeconds,
  settingsHref,
  onTicketClick,
}: Props) {
  const computeGrid = useCallback(() => {
    const cells = new Map<string, GridCell>();
    let hasUnmatched = false;

    // Initialize all cells for defined swimlanes
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
        ticket.stepIntervalHours,
        maxSteps,
      );

      const filterCtx = buildFilterContext(ticket);
      let laneId = assignSwimlane(swimlanes, filterCtx);

      // Auto "Unmatched" lane for tickets matching no swimlane
      if (!laneId) {
        laneId = UNMATCHED_LANE_ID;
        if (!hasUnmatched) {
          hasUnmatched = true;
          for (let step = 0; step < maxSteps; step++) {
            const key = `${UNMATCHED_LANE_ID}:${step}`;
            cells.set(key, { swimlaneId: UNMATCHED_LANE_ID, stepIndex: step, tickets: [] });
          }
        }
      }

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

    return { cells, hasUnmatched };
  }, [tickets, swimlanes, colorRules, maxSteps]);

  const [gridState, setGridState] = useState(() => computeGrid());
  const [tick, setTick] = useState(0);

  // Recompute grid on every tick
  useEffect(() => {
    setGridState(computeGrid());
  }, [computeGrid, tick]);

  // Client-side refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, refreshIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [refreshIntervalSeconds]);

  const { cells: grid, hasUnmatched } = gridState;

  // Build effective columns: swimlanes + optional Unmatched
  const effectiveLanes = [
    ...swimlanes,
    ...(hasUnmatched
      ? [{ id: UNMATCHED_LANE_ID, name: "Unmatched", order: 999, isCatchAll: false, filterExprJson: {} as unknown }]
      : []),
  ];

  if (swimlanes.length === 0 && !hasUnmatched) {
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

  const colCount = effectiveLanes.length;

  // Rows: maxSteps-1 at top (oldest) → 0 at bottom (newest)
  const rowIndices = Array.from({ length: maxSteps }, (_, i) => maxSteps - 1 - i);

  return (
    <div className="flex-1 overflow-auto">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 grid border-b bg-background"
        style={{
          gridTemplateColumns: `4rem repeat(${colCount}, minmax(180px, 1fr))`,
        }}
      >
        <div className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground">
          Step
        </div>
        {effectiveLanes.map((lane) => (
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
            {lane.id === UNMATCHED_LANE_ID && (
              <span className="ml-1 text-[10px] font-normal text-amber-500">
                (auto)
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
            gridTemplateColumns: `4rem repeat(${colCount}, minmax(180px, 1fr))`,
            minHeight: "3.5rem",
            backgroundColor: stepRowColor(stepIdx, maxSteps),
          }}
        >
          {/* Row label */}
          <div className="flex items-center justify-center border-r px-2 text-xs font-mono text-muted-foreground">
            {stepIdx}
          </div>

          {/* Cells */}
          {effectiveLanes.map((lane) => {
            const cell = grid.get(`${lane.id}:${stepIdx}`);
            const cellId = `active-${lane.id}-${stepIdx}`;
            return (
              <DroppableZone
                key={lane.id}
                id={cellId}
                data={{ zone: "active", swimlaneId: lane.id, stepIndex: stepIdx }}
                className="border-l p-1.5"
              >
                {cell && cell.tickets.length > 0 ? (
                  <div className="space-y-1.5" data-testid={`grid-cell-${lane.id}-${stepIdx}`}>
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
                          data-testid={`active-ticket-${ticket.id}`}
                          className="rounded-md border p-2 shadow-sm transition-all duration-500 ease-in-out cursor-pointer hover:border-ring"
                          style={{
                            borderLeftColor: ticket.resolvedColor,
                            borderLeftWidth: "3px",
                          }}
                          onClick={() => onTicketClick?.(ticket.id)}
                        >
                          <div className="mb-0.5 flex items-center gap-1.5">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: ticket.resolvedColor }}
                            />
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              {ticket.type.key}
                            </span>
                            {ticket.hasParent && (
                              <span className="rounded bg-violet-100 px-1 py-px text-[8px] font-semibold uppercase leading-none text-violet-700">
                                child
                              </span>
                            )}
                            {ticket.childCount > 0 && (
                              <span className="rounded bg-amber-100 px-1 py-px text-[8px] font-semibold uppercase leading-none text-amber-700">
                                parent · {ticket.childCount}
                              </span>
                            )}
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
                ) : (
                  <div className="flex h-full min-h-[2rem] items-center justify-center rounded border border-dashed border-muted-foreground/20">
                    <span className="text-[10px] text-muted-foreground/30">
                      drop
                    </span>
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
