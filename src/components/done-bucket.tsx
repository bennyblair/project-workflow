import { TicketCard } from "@/components/ticket-card";

type Ticket = {
  id: string;
  title: string;
  type: { key: string; defaultColorHex: string };
  assignee?: { name: string } | null;
  team?: { name: string } | null;
};

type Props = {
  tickets: Ticket[];
  onTicketClick?: (ticketId: string) => void;
};

export function DoneBucket({ tickets, onTicketClick }: Props) {
  return (
    <section className="flex w-72 flex-shrink-0 flex-col border-l bg-muted/30">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Done
        </h2>
        <span className="text-xs text-muted-foreground">
          {tickets.length} ticket{tickets.length !== 1 && "s"}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              variant="done"
              onClick={onTicketClick ? () => onTicketClick(ticket.id) : undefined}
            />
          ))}
          {tickets.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No completed tickets
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
