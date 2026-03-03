"use client";

import { useState, useActionState } from "react";
import {
  createPerson,
  updatePerson,
  deletePerson,
  createTeam,
  updateTeam,
  deleteTeam,
  type ActionState,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Person = { id: string; name: string };
type Team = { id: string; name: string };

type Props = {
  boardId: string;
  people: Person[];
  teams: Team[];
};

const initialState: ActionState = { success: false };

// ── Reusable inline-editable row ────────────────────────────────────────────

function EditableRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: { id: string; name: string };
  onUpdate: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  onDelete: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [updateState, updateAction, isUpdating] = useActionState(
    async (prev: ActionState, fd: FormData) => {
      const r = await onUpdate(prev, fd);
      if (r.success) setIsEditing(false);
      return r;
    },
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(onDelete, initialState);

  if (isEditing) {
    return (
      <form action={updateAction} className="flex items-center gap-2">
        <input type="hidden" name="id" value={item.id} />
        <Input name="name" defaultValue={item.name} className="h-8 w-48 text-sm" autoFocus />
        <Button type="submit" size="sm" disabled={isUpdating}>
          {isUpdating ? "…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
        {updateState.error && (
          <span className="text-xs text-destructive">{updateState.error}</span>
        )}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full border px-3 py-1 text-sm">{item.name}</span>
      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
        Edit
      </Button>
      <form action={deleteAction} className="inline">
        <input type="hidden" name="id" value={item.id} />
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-destructive"
          disabled={isDeleting}
        >
          Delete
        </Button>
      </form>
      {deleteState.error && (
        <span className="text-xs text-destructive">{deleteState.error}</span>
      )}
    </div>
  );
}

// ── Inline create form ──────────────────────────────────────────────────────

function InlineCreateForm({
  boardId,
  onCreate,
  placeholder,
}: {
  boardId: string;
  onCreate: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, action, isPending] = useActionState(
    async (prev: ActionState, fd: FormData) => {
      const r = await onCreate(prev, fd);
      if (r.success) setIsOpen(false);
      return r;
    },
    initialState,
  );

  if (!isOpen) {
    return (
      <Button size="sm" variant="outline" onClick={() => setIsOpen(true)}>
        + Add
      </Button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="boardId" value={boardId} />
      <Input name="name" placeholder={placeholder} required className="h-8 w-48 text-sm" autoFocus />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "…" : "Add"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      {state.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}

// ── Main Tab ────────────────────────────────────────────────────────────────

export function PeopleTeamsTab({ boardId, people, teams }: Props) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">People</h2>
          <InlineCreateForm boardId={boardId} onCreate={createPerson} placeholder="Person name…" />
        </div>
        {people.length === 0 ? (
          <p className="text-sm text-muted-foreground">No people added.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {people.map((p) => (
              <EditableRow key={p.id} item={p} onUpdate={updatePerson} onDelete={deletePerson} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Teams</h2>
          <InlineCreateForm boardId={boardId} onCreate={createTeam} placeholder="Team name…" />
        </div>
        {teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">No teams added.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {teams.map((t) => (
              <EditableRow key={t.id} item={t} onUpdate={updateTeam} onDelete={deleteTeam} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
