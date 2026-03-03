"use client";

import { useState, useActionState } from "react";
import {
  createTicketType,
  updateTicketType,
  deleteTicketType,
  type ActionState,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TicketType = {
  id: string;
  name: string;
  key: string;
  defaultColorHex: string;
  stepIntervalSeconds: number;
};

type Props = {
  boardId: string;
  ticketTypes: TicketType[];
};

const initialState: ActionState = { success: false };

function TicketTypeRow({ tt }: { tt: TicketType }) {
  const [isEditing, setIsEditing] = useState(false);
  const [updateState, updateAction, isUpdating] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await updateTicketType(prev, formData);
      if (result.success) setIsEditing(false);
      return result;
    },
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteTicketType,
    initialState,
  );

  if (isEditing) {
    return (
      <form action={updateAction} className="flex items-center gap-2 rounded-lg border p-3">
        <input type="hidden" name="id" value={tt.id} />
        <Input name="name" defaultValue={tt.name} className="h-8 w-32 text-sm" />
        <Input name="key" defaultValue={tt.key} className="h-8 w-20 text-sm" />
        <Input
          name="defaultColorHex"
          type="color"
          defaultValue={tt.defaultColorHex}
          className="h-8 w-12 cursor-pointer p-0.5"
        />
        <Input
          name="stepIntervalSeconds"
          type="number"
          min={1}
          defaultValue={tt.stepIntervalSeconds}
          className="h-8 w-24 text-sm"
        />
        <span className="text-xs text-muted-foreground">s/step</span>
        <div className="ml-auto flex gap-1">
          <Button type="submit" size="sm" variant="default" disabled={isUpdating}>
            {isUpdating ? "…" : "Save"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
        {updateState.error && (
          <span className="text-xs text-destructive">{updateState.error}</span>
        )}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <span
        className="inline-block h-4 w-4 rounded"
        style={{ backgroundColor: tt.defaultColorHex }}
      />
      <span className="font-medium">{tt.name}</span>
      <span className="text-xs text-muted-foreground">{tt.key}</span>
      <span className="ml-auto text-xs text-muted-foreground">
        {tt.stepIntervalSeconds}s per step
      </span>
      <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
        Edit
      </Button>
      <form action={deleteAction}>
        <input type="hidden" name="id" value={tt.id} />
        <Button type="submit" size="sm" variant="ghost" className="text-destructive" disabled={isDeleting}>
          Delete
        </Button>
      </form>
      {deleteState.error && (
        <span className="text-xs text-destructive">{deleteState.error}</span>
      )}
    </div>
  );
}

export function TicketTypesTab({ boardId, ticketTypes }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [createState, createAction, isCreatingPending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await createTicketType(prev, formData);
      if (result.success) setIsCreating(false);
      return result;
    },
    initialState,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ticket Types</h2>
        <Button size="sm" onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? "Cancel" : "+ New Type"}
        </Button>
      </div>

      {isCreating && (
        <form action={createAction} className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <input type="hidden" name="boardId" value={boardId} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Name</label>
              <Input name="name" placeholder="e.g. Bug" required className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Key</label>
              <Input name="key" placeholder="e.g. BUG" required maxLength={10} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Color</label>
              <Input name="defaultColorHex" type="color" defaultValue="#6366f1" className="h-8 w-16 cursor-pointer p-0.5" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Step Interval (s)</label>
              <Input name="stepIntervalSeconds" type="number" min={1} defaultValue={180} className="h-8 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={isCreatingPending}>
              {isCreatingPending ? "Creating…" : "Create"}
            </Button>
            {createState.error && (
              <span className="text-xs text-destructive">{createState.error}</span>
            )}
          </div>
        </form>
      )}

      {ticketTypes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No ticket types configured.</p>
      ) : (
        <div className="space-y-2">
          {ticketTypes.map((tt) => (
            <TicketTypeRow key={tt.id} tt={tt} />
          ))}
        </div>
      )}
    </div>
  );
}
