"use client";

import * as Tabs from "@radix-ui/react-tabs";

type Board = {
  id: string;
  name: string;
  maxSteps: number;
  refreshIntervalSeconds: number;
  ticketTypes: { id: string; name: string; key: string; defaultColorHex: string; stepIntervalSeconds: number }[];
  teams: { id: string; name: string }[];
  people: { id: string; name: string }[];
  swimlanes: { id: string; name: string; order: number; isCatchAll: boolean }[];
  colorRules: { id: string; order: number; colorHex: string }[];
};

export function SettingsTabs({ board }: { board: Board }) {
  return (
    <Tabs.Root defaultValue="board" className="w-full">
      <Tabs.List className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
        {["Board", "Ticket Types", "Swimlanes", "Color Rules", "People & Teams"].map(
          (tab) => (
            <Tabs.Trigger
              key={tab}
              value={tab.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {tab}
            </Tabs.Trigger>
          ),
        )}
      </Tabs.List>

      <Tabs.Content value="board" className="space-y-4">
        <h2 className="text-lg font-semibold">Board Settings</h2>
        <div className="rounded-lg border p-4">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Name</dt>
              <dd>{board.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Max Steps</dt>
              <dd>{board.maxSteps}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">
                Refresh Interval
              </dt>
              <dd>{board.refreshIntervalSeconds}s</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Editing board settings will be available in a future milestone.
          </p>
        </div>
      </Tabs.Content>

      <Tabs.Content value="ticket-types" className="space-y-4">
        <h2 className="text-lg font-semibold">Ticket Types</h2>
        {board.ticketTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ticket types configured.</p>
        ) : (
          <div className="space-y-2">
            {board.ticketTypes.map((tt) => (
              <div
                key={tt.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <span
                  className="inline-block h-4 w-4 rounded"
                  style={{ backgroundColor: tt.defaultColorHex }}
                />
                <span className="font-medium">{tt.name}</span>
                <span className="text-xs text-muted-foreground">{tt.key}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {tt.stepIntervalSeconds}s per step
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Editing ticket types will be available in a future milestone.
        </p>
      </Tabs.Content>

      <Tabs.Content value="swimlanes" className="space-y-4">
        <h2 className="text-lg font-semibold">Swimlanes</h2>
        {board.swimlanes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No swimlanes configured.</p>
        ) : (
          <div className="space-y-2">
            {board.swimlanes.map((lane) => (
              <div
                key={lane.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <span className="text-xs font-mono text-muted-foreground">
                  #{lane.order}
                </span>
                <span className="font-medium">{lane.name}</span>
                {lane.isCatchAll && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    Catch-all
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Editing swimlanes will be available in a future milestone.
        </p>
      </Tabs.Content>

      <Tabs.Content value="color-rules" className="space-y-4">
        <h2 className="text-lg font-semibold">Color Rules</h2>
        {board.colorRules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No color rules configured.</p>
        ) : (
          <div className="space-y-2">
            {board.colorRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <span className="text-xs font-mono text-muted-foreground">
                  #{rule.order}
                </span>
                <span
                  className="inline-block h-4 w-4 rounded"
                  style={{ backgroundColor: rule.colorHex }}
                />
                <span className="font-mono text-sm">{rule.colorHex}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Editing color rules will be available in a future milestone.
        </p>
      </Tabs.Content>

      <Tabs.Content value="people-teams" className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">People</h2>
          {board.people.length === 0 ? (
            <p className="text-sm text-muted-foreground">No people added.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {board.people.map((person) => (
                <span
                  key={person.id}
                  className="rounded-full border px-3 py-1 text-sm"
                >
                  {person.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Teams</h2>
          {board.teams.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teams added.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {board.teams.map((team) => (
                <span
                  key={team.id}
                  className="rounded-full border px-3 py-1 text-sm"
                >
                  {team.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Editing people and teams will be available in a future milestone.
        </p>
      </Tabs.Content>
    </Tabs.Root>
  );
}
