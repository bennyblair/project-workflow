"use client";

import { useState, useActionState } from "react";
import {
  createColorRule,
  updateColorRule,
  deleteColorRule,
  type ActionState,
} from "@/actions/settings";
import { ExpressionBuilder } from "@/components/expression-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ColorRule = {
  id: string;
  order: number;
  whenExprJson: unknown;
  colorHex: string;
};

type Props = {
  boardId: string;
  colorRules: ColorRule[];
};

const initialState: ActionState = { success: false };

// ── Color Rule Row ──────────────────────────────────────────────────────────

function ColorRuleRow({ rule }: { rule: ColorRule }) {
  const [isEditing, setIsEditing] = useState(false);
  const [whenExpr, setWhenExpr] = useState<unknown>(rule.whenExprJson);

  const [updateState, updateAction, isUpdating] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await updateColorRule(prev, formData);
      if (result.success) setIsEditing(false);
      return result;
    },
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteColorRule,
    initialState,
  );

  if (isEditing) {
    return (
      <form
        action={(fd) => {
          fd.set("whenExprJson", JSON.stringify(whenExpr));
          updateAction(fd);
        }}
        className="space-y-3 rounded-lg border p-4"
      >
        <input type="hidden" name="id" value={rule.id} />
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Order</label>
            <Input name="order" type="number" min={0} defaultValue={rule.order} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Color</label>
            <div className="flex items-center gap-2">
              <Input
                name="colorHex"
                type="color"
                defaultValue={rule.colorHex}
                className="h-8 w-12 cursor-pointer p-0.5"
              />
              <Input
                name="colorHexText"
                defaultValue={rule.colorHex}
                className="h-8 w-24 font-mono text-xs"
                pattern="^#[0-9a-fA-F]{6}$"
                onChange={(e) => {
                  const colorInput = e.target.previousElementSibling as HTMLInputElement;
                  if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                    colorInput.value = e.target.value;
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">When Expression</label>
          <ExpressionBuilder value={whenExpr} onChange={setWhenExpr} allowStepIndex />
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
      <span className="font-mono text-xs text-muted-foreground">#{rule.order}</span>
      <span
        className="inline-block h-5 w-5 rounded"
        style={{ backgroundColor: rule.colorHex }}
      />
      <span className="font-mono text-sm">{rule.colorHex}</span>
      <span className="ml-auto text-xs text-muted-foreground">
        {Object.keys(rule.whenExprJson as object).length === 0
          ? "No condition (always matches)"
          : "Has condition"}
      </span>
      <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
        Edit
      </Button>
      <form action={deleteAction}>
        <input type="hidden" name="id" value={rule.id} />
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

function CreateColorRuleForm({
  boardId,
  onDone,
}: {
  boardId: string;
  onDone: () => void;
}) {
  const [whenExpr, setWhenExpr] = useState<unknown>({});

  const [state, formAction, isPending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await createColorRule(prev, formData);
      if (result.success) onDone();
      return result;
    },
    initialState,
  );

  return (
    <form
      action={(fd) => {
        fd.set("whenExprJson", JSON.stringify(whenExpr));
        formAction(fd);
      }}
      className="space-y-3 rounded-lg border bg-muted/30 p-4"
    >
      <input type="hidden" name="boardId" value={boardId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">Color</label>
          <div className="flex items-center gap-2">
            <Input
              name="colorHex"
              type="color"
              defaultValue="#ef4444"
              className="h-8 w-12 cursor-pointer p-0.5"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">When Expression</label>
        <ExpressionBuilder value={whenExpr} onChange={setWhenExpr} allowStepIndex />
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

export function ColorRulesTab({ boardId, colorRules }: Props) {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Color Rules</h2>
        <Button size="sm" onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? "Cancel" : "+ New Rule"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Rules are evaluated in order. The first matching rule wins. If no rule matches, the ticket
        type&apos;s default color is used.
      </p>

      {isCreating && (
        <CreateColorRuleForm boardId={boardId} onDone={() => setIsCreating(false)} />
      )}

      {colorRules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No color rules configured.</p>
      ) : (
        <div className="space-y-2">
          {colorRules.map((rule) => (
            <ColorRuleRow key={rule.id} rule={rule} />
          ))}
        </div>
      )}
    </div>
  );
}
