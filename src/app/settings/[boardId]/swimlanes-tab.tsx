"use client";

import { useState, useActionState } from "react";
import {
  createSwimlane,
  updateSwimlane,
  deleteSwimlane,
  type ActionState,
} from "@/actions/settings";
import { ExpressionBuilder } from "@/components/expression-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Swimlane = {
  id: string;
  name: string;
  order: number;
  isCatchAll: boolean;
  filterExprJson: unknown;
  onDropPatchJson: unknown;
};

type Props = {
  boardId: string;
  swimlanes: Swimlane[];
};

const initialState: ActionState = { success: false };

// ── Swimlane Row ────────────────────────────────────────────────────────────

function SwimlaneRow({ lane }: { lane: Swimlane }) {
  const [isEditing, setIsEditing] = useState(false);
  const [filterExpr, setFilterExpr] = useState<unknown>(lane.filterExprJson);
  const [patchJson, setPatchJson] = useState(
    JSON.stringify(lane.onDropPatchJson ?? {}, null, 2),
  );

  const [updateState, updateAction, isUpdating] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await updateSwimlane(prev, formData);
      if (result.success) setIsEditing(false);
      return result;
    },
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteSwimlane,
    initialState,
  );

  if (isEditing) {
    return (
      <form
        action={(fd) => {
          fd.set("filterExprJson", JSON.stringify(filterExpr));
          fd.set("onDropPatchJson", patchJson);
          updateAction(fd);
        }}
        className="space-y-3 rounded-lg border p-4"
      >
        <input type="hidden" name="id" value={lane.id} />
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Name</label>
            <Input name="name" defaultValue={lane.name} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Order</label>
            <Input name="order" type="number" min={0} defaultValue={lane.order} className="h-8 text-sm" />
          </div>
          <div className="flex items-end gap-2 pb-0.5">
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                name="isCatchAll"
                value="true"
                defaultChecked={lane.isCatchAll}
                className="rounded"
              />
              Catch-all
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Filter Expression</label>
          <ExpressionBuilder value={filterExpr} onChange={setFilterExpr} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">
            onDropPatch JSON{" "}
            <span className="font-normal text-muted-foreground">
              (fields to set when dropping into this lane)
            </span>
          </label>
          <textarea
            value={patchJson}
            onChange={(e) => setPatchJson(e.target.value)}
            className="h-20 w-full rounded-md border bg-background p-2 font-mono text-xs"
            spellCheck={false}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={isUpdating}>
            {isUpdating ? "Saving…" : "Save"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          {updateState.error && (
            <span className="text-xs text-destructive">{updateState.error}</span>
          )}
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <span className="font-mono text-xs text-muted-foreground">#{lane.order}</span>
      <span className="font-medium">{lane.name}</span>
      {lane.isCatchAll && (
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          Catch-all
        </span>
      )}
      <span className="ml-auto text-xs text-muted-foreground">
        {Object.keys(lane.filterExprJson as object).length === 0
          ? "No filter"
          : "Has filter"}
      </span>
      <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
        Edit
      </Button>
      <form action={deleteAction}>
        <input type="hidden" name="id" value={lane.id} />
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="text-destructive"
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

// ── Create Form ─────────────────────────────────────────────────────────────

function CreateSwimlaneForm({
  boardId,
  onDone,
}: {
  boardId: string;
  onDone: () => void;
}) {
  const [filterExpr, setFilterExpr] = useState<unknown>({});
  const [patchJson, setPatchJson] = useState("{}");

  const [state, formAction, isPending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await createSwimlane(prev, formData);
      if (result.success) onDone();
      return result;
    },
    initialState,
  );

  return (
    <form
      action={(fd) => {
        fd.set("filterExprJson", JSON.stringify(filterExpr));
        fd.set("onDropPatchJson", patchJson);
        formAction(fd);
      }}
      className="space-y-3 rounded-lg border bg-muted/30 p-4"
    >
      <input type="hidden" name="boardId" value={boardId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">Name</label>
          <Input name="name" placeholder="e.g. Bugs" required className="h-8 text-sm" />
        </div>
        <div className="flex items-end gap-2 pb-0.5">
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" name="isCatchAll" value="true" className="rounded" />
            Catch-all
          </label>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Filter Expression</label>
        <ExpressionBuilder value={filterExpr} onChange={setFilterExpr} />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">
          onDropPatch JSON{" "}
          <span className="font-normal text-muted-foreground">
            (fields to set when dropping into this lane)
          </span>
        </label>
        <textarea
          value={patchJson}
          onChange={(e) => setPatchJson(e.target.value)}
          className="h-20 w-full rounded-md border bg-background p-2 font-mono text-xs"
          spellCheck={false}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Creating…" : "Create"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        {state.error && <span className="text-xs text-destructive">{state.error}</span>}
      </div>
    </form>
  );
}

// ── Main Tab ────────────────────────────────────────────────────────────────

export function SwimlanesTab({ boardId, swimlanes }: Props) {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Swimlanes</h2>
        <Button size="sm" onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? "Cancel" : "+ New Swimlane"}
        </Button>
      </div>

      {isCreating && (
        <CreateSwimlaneForm boardId={boardId} onDone={() => setIsCreating(false)} />
      )}

      {swimlanes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No swimlanes configured.</p>
      ) : (
        <div className="space-y-2">
          {swimlanes.map((lane) => (
            <SwimlaneRow key={lane.id} lane={lane} />
          ))}
        </div>
      )}
    </div>
  );
}
