"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createTicket, type ActionState } from "@/actions/ticket";
import { TicketCard } from "@/components/ticket-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Ticket = {
  id: string;
  title: string;
  type: { key: string; defaultColorHex: string };
  assignee?: { name: string } | null;
  team?: { name: string } | null;
};

type TicketType = {
  id: string;
  name: string;
  key: string;
  defaultColorHex: string;
};

type Props = {
  boardId: string;
  tickets: Ticket[];
  ticketTypes: TicketType[];
  onTicketClick?: (ticketId: string) => void;
};

const initialState: ActionState = { success: false };

export function TodoBacklog({ boardId, tickets, ticketTypes, onTicketClick }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await createTicket(prev, formData);
      if (result.success) setIsCreating(false);
      return result;
    },
    initialState,
  );

  return (
    <section className="flex w-72 flex-shrink-0 flex-col border-r bg-muted/30">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Todo
          </h2>
          <span className="text-xs text-muted-foreground">
            {tickets.length} ticket{tickets.length !== 1 && "s"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? "Cancel" : "+ New"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isCreating && (
          <form action={formAction} className="mb-3 space-y-2 rounded-lg border bg-card p-3">
            <input type="hidden" name="boardId" value={boardId} />
            <Input
              name="title"
              placeholder="Ticket title…"
              required
              maxLength={200}
              autoFocus
              className="h-8 text-sm"
            />
            {ticketTypes.length > 0 && (
              <select
                name="typeId"
                required
                className="h-8 w-full rounded-md border bg-background px-2 text-sm"
                defaultValue={ticketTypes[0].id}
              >
                {ticketTypes.map((tt) => (
                  <option key={tt.id} value={tt.id}>
                    {tt.name} ({tt.key})
                  </option>
                ))}
              </select>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Creating…" : "Create"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
            </div>
            {state.error && (
              <p className="text-xs text-destructive">{state.error}</p>
            )}
          </form>
        )}

        <div className="space-y-2">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={onTicketClick ? () => onTicketClick(ticket.id) : undefined}
            />
          ))}
          {tickets.length === 0 && !isCreating && (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No todo tickets
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
