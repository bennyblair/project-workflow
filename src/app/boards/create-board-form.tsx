"use client";

import { useActionState } from "react";
import { createBoard, type ActionState } from "@/actions/board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: ActionState = { success: false };

export function CreateBoardForm() {
  const [state, formAction, isPending] = useActionState(createBoard, initialState);

  return (
    <form action={formAction} className="flex gap-3" data-testid="create-board-form">
      <Input
        name="name"
        placeholder="New board name…"
        required
        maxLength={100}
        className="max-w-xs"
        data-testid="board-name-input"
      />
      <Button type="submit" disabled={isPending} data-testid="create-board-submit">
        {isPending ? "Creating…" : "Create Board"}
      </Button>
      {state.error && (
        <p className="self-center text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
