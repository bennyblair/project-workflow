"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTicketDetail, type TicketDetail } from "@/actions/ticket-detail";
import { updateTicketFields, type ActionState } from "@/actions/ticket";
import { LinkParentDialog } from "@/components/link-parent-dialog";

type Props = {
  ticketId: string | null;
  onClose: () => void;
};

export function TicketDetailPanel({ ticketId, onClose }: Props) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  // Navigation stack for drilling into parent/child tickets
  const [activeId, setActiveId] = useState<string | null>(ticketId);
  const [history, setHistory] = useState<string[]>([]);

  // When the external ticketId prop changes, reset internal navigation
  useEffect(() => {
    setActiveId(ticketId);
    setHistory([]);
  }, [ticketId]);

  useEffect(() => {
    if (!activeId) {
      setTicket(null);
      return;
    }
    setLoading(true);
    getTicketDetail(activeId).then((data) => {
      setTicket(data);
      setLoading(false);
    });
  }, [activeId]);

  const navigateToTicket = useCallback((id: string) => {
    setActiveId((prev) => {
      if (prev) setHistory((h) => [...h, prev]);
      return id;
    });
  }, []);

  const navigateBack = useCallback(() => {
    setHistory((h) => {
      const next = [...h];
      const prev = next.pop();
      if (prev) setActiveId(prev);
      return next;
    });
  }, []);

  const handleFieldSave = useCallback(
    (formData: FormData) => {
      if (!ticket) return;
      formData.set("id", ticket.id);
      startTransition(async () => {
        const result = await updateTicketFields(
          { success: false } as ActionState,
          formData,
        );
        if (result.success) {
          setSaveMessage("Saved");
          const updated = await getTicketDetail(ticket.id);
          if (updated) setTicket(updated);
          setTimeout(() => setSaveMessage(null), 2000);
        } else {
          setSaveMessage(result.error ?? "Save failed");
          setTimeout(() => setSaveMessage(null), 3000);
        }
      });
    },
    [ticket, startTransition],
  );

  const handleClose = useCallback(() => {
    setHistory([]);
    onClose();
  }, [onClose]);

  return (
    <Sheet open={!!ticketId} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent data-testid="ticket-detail-panel">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        ) : !ticket ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Ticket not found</p>
          </div>
        ) : (
          <>
            <SheetHeader>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={navigateBack}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1 self-start"
                >
                  <span aria-hidden>←</span> Back
                </button>
              )}
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: ticket.type.defaultColorHex }}
                />
                <span className="text-sm font-semibold text-muted-foreground">
                  {ticket.type.key}
                </span>
                <StatusBadge status={ticket.status} />
              </div>
              <SheetTitle>{ticket.title}</SheetTitle>
              <SheetDescription>
                Created {formatDate(ticket.createdAt)}
              </SheetDescription>
              {saveMessage && (
                <p
                  className={`text-xs ${
                    saveMessage === "Saved"
                      ? "text-green-600"
                      : "text-destructive"
                  }`}
                >
                  {saveMessage}
                  {isPending && " …"}
                </p>
              )}
            </SheetHeader>

            <Tabs defaultValue="overview" className="flex flex-1 flex-col">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="flex-1 overflow-y-auto p-4">
                <OverviewTab
                  ticket={ticket}
                  onSave={handleFieldSave}
                  isPending={isPending}
                  onNavigate={navigateToTicket}
                />
              </TabsContent>

              <TabsContent value="attachments" className="p-4">
                <AttachmentsTab />
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    TODO: "bg-yellow-100 text-yellow-800",
    ACTIVE: "bg-blue-100 text-blue-800",
    DONE: "bg-green-100 text-green-800",
  };
  return (
    <span
      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
        colors[status] ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Overview Tab — inline editing of fields
// ---------------------------------------------------------------------------

function OverviewTab({
  ticket,
  onSave,
  isPending,
  onNavigate,
}: {
  ticket: TicketDetail;
  onSave: (fd: FormData) => void;
  isPending: boolean;
  onNavigate: (id: string) => void;
}) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveField = (field: string, value: string) => {
    const fd = new FormData();
    fd.set(field, value);
    onSave(fd);
    setEditingField(null);
  };

  const saveSelect = (field: string, value: string) => {
    const fd = new FormData();
    fd.set(field, value);
    onSave(fd);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <FieldRow label="Title">
        {editingField === "title" ? (
          <div className="flex items-center gap-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-7 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveField("title", editValue);
                if (e.key === "Escape") cancelEdit();
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => saveField("title", editValue)}
              disabled={isPending}
              className="h-7 px-2 text-xs"
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelEdit}
              className="h-7 px-2 text-xs"
            >
              ✕
            </Button>
          </div>
        ) : (
          <span
            className="cursor-pointer text-sm hover:underline"
            onClick={() => startEdit("title", ticket.title)}
          >
            {ticket.title}
          </span>
        )}
      </FieldRow>

      {/* Status */}
      <FieldRow label="Status">
        <StatusBadge status={ticket.status} />
      </FieldRow>

      {/* Type */}
      <FieldRow label="Type">
        <select
          className="h-7 rounded-md border bg-background px-2 text-sm"
          value={ticket.type.id}
          onChange={(e) => saveSelect("typeId", e.target.value)}
          disabled={isPending}
        >
          {ticket.availableTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.key})
            </option>
          ))}
        </select>
      </FieldRow>

      {/* Assignee */}
      <FieldRow label="Assignee">
        <select
          className="h-7 rounded-md border bg-background px-2 text-sm"
          value={ticket.assignee?.id ?? ""}
          onChange={(e) => saveSelect("assigneeId", e.target.value)}
          disabled={isPending}
        >
          <option value="">Unassigned</option>
          {ticket.availablePeople.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </FieldRow>

      {/* Team */}
      <FieldRow label="Team">
        <select
          className="h-7 rounded-md border bg-background px-2 text-sm"
          value={ticket.team?.id ?? ""}
          onChange={(e) => saveSelect("teamId", e.target.value)}
          disabled={isPending}
        >
          <option value="">No team</option>
          {ticket.availableTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </FieldRow>

      {/* Parent */}
      <ParentSection
        ticket={ticket}
        onSave={onSave}
        isPending={isPending}
        onNavigate={onNavigate}
      />

      {/* Children */}
      {ticket.children.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Child Tickets ({ticket.children.length})
          </h3>
          <div className="space-y-1">
            {ticket.children.map((child) => (
              <button
                type="button"
                key={child.id}
                className="flex w-full items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors cursor-pointer text-left"
                onClick={() => onNavigate(child.id)}
              >
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: child.type.defaultColorHex }}
                />
                <span className="font-medium text-muted-foreground">
                  {child.type.key}
                </span>
                <span className="truncate flex-1">{child.title}</span>
                <StatusBadge status={child.status} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-6 space-y-2 border-t pt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Timestamps
        </h3>
        <FieldRow label="Created">
          <span className="text-sm text-muted-foreground">
            {formatDate(ticket.createdAt)}
          </span>
        </FieldRow>
        <FieldRow label="Updated">
          <span className="text-sm text-muted-foreground">
            {formatDate(ticket.updatedAt)}
          </span>
        </FieldRow>
        {ticket.startedAt && (
          <FieldRow label="Started">
            <span className="text-sm text-muted-foreground">
              {formatDate(ticket.startedAt)}
            </span>
          </FieldRow>
        )}
        {ticket.doneAt && (
          <FieldRow label="Completed">
            <span className="text-sm text-muted-foreground">
              {formatDate(ticket.doneAt)}
            </span>
          </FieldRow>
        )}
      </div>

      {/* Description */}
      <DescriptionSection
        ticket={ticket}
        onSave={onSave}
        isPending={isPending}
      />

      {/* Audit Log */}
      <AuditLogSection events={ticket.events} />
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Parent Section — link/unlink parent ticket with search dialog
// ---------------------------------------------------------------------------

function ParentSection({
  ticket,
  onSave,
  isPending,
  onNavigate,
}: {
  ticket: TicketDetail;
  onSave: (fd: FormData) => void;
  isPending: boolean;
  onNavigate: (id: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleLinkParent = (parentId: string) => {
    const fd = new FormData();
    fd.set("parentId", parentId);
    onSave(fd);
  };

  const handleUnlinkParent = () => {
    const fd = new FormData();
    fd.set("parentId", "");
    onSave(fd);
  };

  return (
    <>
      <FieldRow label="Parent">
        {ticket.parent ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-2 min-w-0 hover:underline cursor-pointer"
              onClick={() => onNavigate(ticket.parent!.id)}
            >
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: ticket.parent.type.defaultColorHex }}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {ticket.parent.type.key}
              </span>
              <span className="truncate text-sm">{ticket.parent.title}</span>
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 px-1.5 text-xs text-destructive"
              onClick={handleUnlinkParent}
              disabled={isPending}
            >
              Unlink
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setDialogOpen(true)}
            disabled={isPending}
          >
            + Link Parent
          </Button>
        )}
      </FieldRow>

      <LinkParentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        projectId={ticket.projectId}
        ticketId={ticket.id}
        onSelect={handleLinkParent}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Description Section — inline in overview tab
// ---------------------------------------------------------------------------

function DescriptionSection({
  ticket,
  onSave,
  isPending,
}: {
  ticket: TicketDetail;
  onSave: (fd: FormData) => void;
  isPending: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(ticket.description ?? "");

  // Sync when ticket changes
  useEffect(() => {
    setValue(ticket.description ?? "");
  }, [ticket.description]);

  const handleSave = () => {
    const fd = new FormData();
    fd.set("description", value);
    onSave(fd);
    setIsEditing(false);
  };

  return (
    <div className="mt-6 space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Description
        </h3>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setValue(ticket.description ?? "");
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <textarea
          className="min-h-[200px] w-full rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a description…"
          autoFocus
        />
      ) : (
        <div className="min-h-[100px] rounded-md border bg-muted/30 p-3">
          {ticket.description ? (
            <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap">
              {ticket.description}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No description. Click Edit to add one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Attachments Tab — placeholder
// ---------------------------------------------------------------------------

function AttachmentsTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="rounded-full bg-muted p-4">
        <svg
          className="h-8 w-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        Attachments coming soon
      </p>
      <Button variant="outline" size="sm" disabled>
        Add attachment
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audit Log Section — inline in overview tab
// ---------------------------------------------------------------------------

const EVENT_LABELS: Record<string, string> = {
  TICKET_CREATED: "Ticket created",
  STATUS_CHANGED: "Status changed",
  TITLE_UPDATED: "Title updated",
  DESCRIPTION_UPDATED: "Description updated",
  TYPE_CHANGED: "Type changed",
  ASSIGNEE_CHANGED: "Assignee changed",
  TEAM_CHANGED: "Team changed",
  PARENT_CHANGED: "Parent changed",
  SWIMLANE_DROPPED: "Moved to swimlane",
  ORDER_CHANGED: "Reordered",
};

function AuditLogSection({
  events,
}: {
  events: { id: string; type: string; dataJson: unknown; createdAt: string }[];
}) {
  if (events.length === 0) {
    return (
      <div className="mt-6 border-t pt-4">
        <p className="py-4 text-center text-sm text-muted-foreground">
          No audit events yet
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-0 border-t pt-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Activity
      </h3>
      <div className="relative border-l-2 border-muted pl-4">
        {events.map((event) => (
          <div key={event.id} className="relative mb-4 pb-1">
            {/* Timeline dot */}
            <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-muted bg-background" />
            <p className="text-sm font-medium">
              {EVENT_LABELS[event.type] ?? event.type}
            </p>
            <EventDetail type={event.type} data={event.dataJson} />
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {formatDate(event.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventDetail({ type, data }: { type: string; data: unknown }) {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  if (
    type === "STATUS_CHANGED" &&
    typeof d.from === "string" &&
    typeof d.to === "string"
  ) {
    return (
      <p className="text-xs text-muted-foreground">
        {d.from} → {d.to}
      </p>
    );
  }

  if (
    (type === "TITLE_UPDATED" || type === "DESCRIPTION_UPDATED") &&
    "from" in d &&
    "to" in d
  ) {
    return (
      <p className="text-xs text-muted-foreground">
        Changed from &ldquo;{String(d.from ?? "(empty)")}&rdquo; to &ldquo;
        {String(d.to ?? "(empty)")}&rdquo;
      </p>
    );
  }

  if (type === "TICKET_CREATED" && typeof d.title === "string") {
    return (
      <p className="text-xs text-muted-foreground">&ldquo;{d.title}&rdquo;</p>
    );
  }

  if (
    (type === "ASSIGNEE_CHANGED" || type === "TEAM_CHANGED" || type === "TYPE_CHANGED") &&
    "from" in d &&
    "to" in d
  ) {
    return (
      <p className="text-xs text-muted-foreground">
        {String(d.from ?? "None")} → {String(d.to ?? "None")}
      </p>
    );
  }

  if (type === "SWIMLANE_DROPPED" && typeof d.swimlaneName === "string") {
    return (
      <p className="text-xs text-muted-foreground">→ {d.swimlaneName}</p>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
