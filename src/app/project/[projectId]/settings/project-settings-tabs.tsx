"use client";

import { useActionState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TicketTypesTab } from "@/app/settings/[boardId]/ticket-types-tab";
import { updateProject, type ActionState } from "@/actions/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Project = {
  id: string;
  name: string;
  ticketTypes: {
    id: string;
    name: string;
    key: string;
    defaultColorHex: string;
    stepIntervalSeconds: number;
  }[];
};

const initialState: ActionState = { success: false };

function ProjectTab({ project }: { project: Project }) {
  const [state, formAction, isPending] = useActionState(updateProject, initialState);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <input type="hidden" name="id" value={project.id} />
      <div className="space-y-2">
        <label htmlFor="project-name" className="text-sm font-medium">
          Project Name
        </label>
        <Input id="project-name" name="name" defaultValue={project.name} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save"}
      </Button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Saved!</p>}
    </form>
  );
}

export function ProjectSettingsTabs({ project }: { project: Project }) {
  return (
    <Tabs defaultValue="project" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="project">Project</TabsTrigger>
        <TabsTrigger value="ticket-types">Ticket Types</TabsTrigger>
      </TabsList>

      <TabsContent value="project">
        <ProjectTab project={project} />
      </TabsContent>

      <TabsContent value="ticket-types">
        <TicketTypesTab projectId={project.id} ticketTypes={project.ticketTypes} />
      </TabsContent>
    </Tabs>
  );
}
