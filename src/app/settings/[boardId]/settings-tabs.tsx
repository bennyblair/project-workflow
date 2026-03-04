"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BoardSettingsTab } from "./board-settings-tab";
import { SwimlanesTab } from "./swimlanes-tab";
import { ColorRulesTab } from "./color-rules-tab";
import { PeopleTeamsTab } from "./people-teams-tab";

type Board = {
  id: string;
  name: string;
  maxSteps: number;
  refreshIntervalSeconds: number;
  teams: { id: string; name: string }[];
  people: { id: string; name: string }[];
  swimlanes: {
    id: string;
    name: string;
    order: number;
    isCatchAll: boolean;
    filterExprJson: unknown;
    onDropPatchJson: unknown;
  }[];
  colorRules: {
    id: string;
    order: number;
    colorHex: string;
    whenExprJson: unknown;
  }[];
};

export function SettingsTabs({ board }: { board: Board }) {
  return (
    <Tabs defaultValue="board" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="board">Board</TabsTrigger>
        <TabsTrigger value="swimlanes">Swimlanes</TabsTrigger>
        <TabsTrigger value="color-rules">Color Rules</TabsTrigger>
        <TabsTrigger value="people-teams">People & Teams</TabsTrigger>
      </TabsList>

      <TabsContent value="board">
        <BoardSettingsTab board={board} />
      </TabsContent>

      <TabsContent value="swimlanes">
        <SwimlanesTab boardId={board.id} swimlanes={board.swimlanes} />
      </TabsContent>

      <TabsContent value="color-rules">
        <ColorRulesTab boardId={board.id} colorRules={board.colorRules} />
      </TabsContent>

      <TabsContent value="people-teams">
        <PeopleTeamsTab
          boardId={board.id}
          people={board.people}
          teams={board.teams}
        />
      </TabsContent>
    </Tabs>
  );
}
