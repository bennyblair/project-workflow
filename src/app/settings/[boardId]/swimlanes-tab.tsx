"use client";

import { useState, useActionState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createSwimlane,
  updateSwimlane,
  deleteSwimlane,
  reorderSwimlanes,
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

// ── Sortable Swimlane Row ────────────────────────────────────────────────────────────

function SortableSwimlaneRow({ lane }: { lane: Swimlane }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition: sortTransition,
    isDragging,
  } = useSortable({ id: lane.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: sortTransition,
    opacity: isDragging ? 0.5 : 1,
  };

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
      <div ref={setNodeRef} style={style}>
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
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border p-3"
    >
      {/* Drag handle */}
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </button>

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

export function SwimlanesTab({ boardId, swimlanes: initialSwimlanes }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [lanes, setLanes] = useState(initialSwimlanes);
  const [, startTransition] = useTransition();

  // Sync with server when props change (after create/delete mutations)
  const [prevInitial, setPrevInitial] = useState(initialSwimlanes);
  if (initialSwimlanes !== prevInitial) {
    setPrevInitial(initialSwimlanes);
    setLanes(initialSwimlanes);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = lanes.findIndex((l) => l.id === active.id);
    const newIndex = lanes.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder locally
    const updated = [...lanes];
    const [moved] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, moved);

    // Update order values
    const reordered = updated.map((l, i) => ({ ...l, order: i }));
    setLanes(reordered);

    // Persist to server
    startTransition(async () => {
      await reorderSwimlanes(boardId, reordered.map((l) => l.id));
    });
  }

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

      {lanes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No swimlanes configured.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={lanes.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {lanes.map((lane) => (
                <SortableSwimlaneRow key={lane.id} lane={lane} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
