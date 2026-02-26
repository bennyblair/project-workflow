"use client";

import Link from "next/link";
import { TodoBacklog } from "@/components/todo-backlog";
import { DoneBucket } from "@/components/done-bucket";
import { TicketCard } from "@/components/ticket-card";

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

type Swimlane = {
  id: string;
  name: string;
  order: number;
  isCatchAll: boolean;
};

type TicketType = {
  id: string;
  name: string;
  key: string;
  defaultColorHex: string;
};

type Props = {
  boardId: string;
  todoTickets: SerializedTicket[];
  activeTickets: SerializedTicket[];
  doneTickets: SerializedTicket[];
  ticketTypes: TicketType[];
  swimlanes: Swimlane[];
  settingsHref: string;
};

export function BoardShell({
  boardId,
  todoTickets,
  activeTickets,
  doneTickets,
  ticketTypes,
  swimlanes,
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
            {swimlanes.length} swimlane{swimlanes.length !== 1 && "s"}
          </span>
        </div>
        <div className="flex-1 overflow-auto p-3">
          {swimlanes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No swimlanes configured.{" "}
              <Link href={settingsHref} className="underline">
                Add swimlanes in settings
              </Link>
            </p>
          ) : (
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${swimlanes.length}, minmax(200px, 1fr))`,
              }}
            >
              {/* Column headers */}
              {swimlanes.map((lane) => (
                <div
                  key={lane.id}
                  className="rounded-t-lg bg-muted/50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {lane.name}
                </div>
              ))}
              {/* Ticket cells — stubbed lane assignment for now */}
              {swimlanes.map((lane) => (
                <div key={lane.id} className="space-y-2">
                  {activeTickets
                    .filter(() => lane.isCatchAll)
                    .map((ticket) => (
                      <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                  {!lane.isCatchAll && (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      Filter evaluation coming soon
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* DONE column */}
      <DoneBucket tickets={doneTickets} />
    </div>
  );
}
