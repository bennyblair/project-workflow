"use client";

import { useActionState } from "react";
import { createProject, type ActionState } from "@/actions/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: ActionState = { success: false };

export function CreateProjectForm() {
  const [state, formAction, isPending] = useActionState(createProject, initialState);

  return (
    <form action={formAction} className="flex gap-3" data-testid="create-project-form">
      <Input
        name="name"
        placeholder="New project name…"
        required
        maxLength={100}
        className="max-w-xs"
        data-testid="project-name-input"
      />
      <Button type="submit" disabled={isPending} data-testid="create-project-submit">
        {isPending ? "Creating…" : "Create Project"}
      </Button>
      {state.error && (
        <p className="self-center text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
