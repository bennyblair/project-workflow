type TicketCardProps = {
  ticket: {
    id: string;
    title: string;
    type: { key: string; defaultColorHex: string };
    assignee?: { name: string } | null;
    team?: { name: string } | null;
    hasParent?: boolean;
    childCount?: number;
  };
  variant?: "default" | "done";
  onClick?: () => void;
};

export function TicketCard({ ticket, variant = "default", onClick }: TicketCardProps) {
  const isDone = variant === "done";

  return (
    <div
      onClick={onClick}
      data-testid={`ticket-card-${ticket.id}`}
      className={`rounded-lg border bg-card p-3 shadow-sm transition-colors ${
        isDone ? "opacity-60" : ""
      } ${onClick ? "cursor-pointer hover:border-ring" : ""}`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: ticket.type.defaultColorHex }}
        />
        <span className="text-xs font-semibold text-muted-foreground">
          {ticket.type.key}
        </span>
        {ticket.hasParent && (
          <span className="rounded bg-violet-100 px-1 py-0.5 text-[9px] font-semibold uppercase leading-none text-violet-700" title="Has parent ticket">
            child
          </span>
        )}
        {(ticket.childCount ?? 0) > 0 && (
          <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold uppercase leading-none text-amber-700" title={`${ticket.childCount} child ticket${ticket.childCount !== 1 ? "s" : ""}`}>
            parent · {ticket.childCount}
          </span>
        )}
        {ticket.team && (
          <span className="ml-auto text-xs text-muted-foreground">
            {ticket.team.name}
          </span>
        )}
      </div>
      <p className={`text-sm font-medium ${isDone ? "line-through" : ""}`}>
        {ticket.title}
      </p>
      {ticket.assignee && (
        <p className="mt-1 text-xs text-muted-foreground">
          {ticket.assignee.name}
        </p>
      )}
    </div>
  );
}
