"use client";

import { TodoBacklog } from "@/components/todo-backlog";
import { DoneBucket } from "@/components/done-bucket";
import { ActiveGrid } from "@/components/active-grid";

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
};

type ActiveTicket = SerializedTicket & {
  startedAt: string;
  stepIntervalSeconds: number;
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
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* TODO column */}
      <TodoBacklog
        boardId={boardId}
        tickets={todoTickets}
        ticketTypes={ticketTypes}
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
          </span>
        </div>
        <ActiveGrid
          tickets={activeTickets}
          swimlanes={swimlanes}
          colorRules={colorRules}
          maxSteps={maxSteps}
          refreshIntervalSeconds={refreshIntervalSeconds}
          settingsHref={settingsHref}
        />
      </section>

      {/* DONE column */}
      <DoneBucket tickets={doneTickets} />
    </div>
  );
}
