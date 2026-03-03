"use client";

import { useActionState } from "react";
import { updateBoardSettings, type ActionState } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  board: {
    id: string;
    name: string;
    maxSteps: number;
    refreshIntervalSeconds: number;
  };
};

const initialState: ActionState = { success: false };

export function BoardSettingsTab({ board }: Props) {
  const [state, formAction, isPending] = useActionState(updateBoardSettings, initialState);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Board Settings</h2>
      <form action={formAction} className="space-y-4 rounded-lg border p-4">
        <input type="hidden" name="id" value={board.id} />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Board Name
            </label>
            <Input name="name" defaultValue={board.name} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Max Steps
            </label>
            <Input
              name="maxSteps"
              type="number"
              min={1}
              max={100}
              defaultValue={board.maxSteps}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Refresh Interval (seconds)
            </label>
            <Input
              name="refreshIntervalSeconds"
              type="number"
              min={1}
              max={3600}
              defaultValue={board.refreshIntervalSeconds}
              className="h-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
          {state.success && (
            <span className="text-xs text-green-600">Saved!</span>
          )}
          {state.error && (
            <span className="text-xs text-destructive">{state.error}</span>
          )}
        </div>
      </form>
    </div>
  );
}
