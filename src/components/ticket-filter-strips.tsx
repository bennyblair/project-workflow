"use client";

import { type FilterOption } from "@/actions/search-tickets";

export type TicketFilters = {
  status?: string;
  typeId?: string;
  boardId?: string;
  teamId?: string;
  assigneeId?: string;
};

type Props = {
  options: FilterOption;
  filters: TicketFilters;
  onChange: (filters: TicketFilters) => void;
  /** Hide the board filter (e.g. when within a single board context) */
  hideBoardFilter?: boolean;
};

export function TicketFilterStrips({
  options,
  filters,
  onChange,
  hideBoardFilter,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Status */}
      <FilterStrip
        label="Status"
        items={[
          { id: "TODO", name: "Todo" },
          { id: "ACTIVE", name: "Active" },
          { id: "DONE", name: "Done" },
        ]}
        selected={filters.status}
        onSelect={(v) => onChange({ ...filters, status: v })}
      />

      {/* Type */}
      {options.types.length > 0 && (
        <FilterStrip
          label="Type"
          items={options.types.map((t) => ({ id: t.id, name: t.name }))}
          selected={filters.typeId}
          onSelect={(v) => onChange({ ...filters, typeId: v })}
          colorMap={Object.fromEntries(
            options.types.map((t) => [t.id, t.defaultColorHex]),
          )}
        />
      )}

      {/* Board */}
      {!hideBoardFilter && options.boards.length > 1 && (
        <FilterStrip
          label="Board"
          items={options.boards.map((b) => ({ id: b.id, name: b.name }))}
          selected={filters.boardId}
          onSelect={(v) => onChange({ ...filters, boardId: v })}
        />
      )}

      {/* Team */}
      {options.teams.length > 0 && (
        <FilterStrip
          label="Team"
          items={options.teams.map((t) => ({ id: t.id, name: t.name }))}
          selected={filters.teamId}
          onSelect={(v) => onChange({ ...filters, teamId: v })}
        />
      )}

      {/* Assignee */}
      {options.assignees.length > 0 && (
        <FilterStrip
          label="Assignee"
          items={options.assignees.map((p) => ({ id: p.id, name: p.name }))}
          selected={filters.assigneeId}
          onSelect={(v) => onChange({ ...filters, assigneeId: v })}
        />
      )}

      {/* Clear all */}
      {Object.values(filters).some(Boolean) && (
        <button
          type="button"
          className="rounded-full border border-dashed border-neon-pink/30 px-2.5 py-0.5 font-[Orbitron] text-[9px] font-bold text-neon-pink/60 hover:bg-neon-pink/10 hover:text-neon-pink transition-all"
          onClick={() => onChange({})}
        >
          Clear all
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual filter strip (pill group)
// ---------------------------------------------------------------------------

function FilterStrip({
  label,
  items,
  selected,
  onSelect,
  colorMap,
}: {
  label: string;
  items: { id: string; name: string }[];
  selected?: string;
  onSelect: (value: string | undefined) => void;
  colorMap?: Record<string, string>;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <span className="mr-1 font-[Orbitron] text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {items.map((item) => {
        const isActive = selected === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-[Orbitron] text-[9px] font-bold tracking-wide transition-all ${
              isActive
                ? "border-neon-pink bg-neon-pink/15 text-neon-pink shadow-[0_0_10px_oklch(0.65_0.28_340_/_0.3)]"
                : "border-border text-foreground hover:border-neon-cyan/40 hover:bg-neon-cyan/5 hover:shadow-[0_0_8px_oklch(0.82_0.16_195_/_0.15)]"
            }`}
            onClick={() => onSelect(isActive ? undefined : item.id)}
          >
            {colorMap?.[item.id] && (
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: colorMap[item.id] }}
              />
            )}
            {item.name}
          </button>
        );
      })}
    </div>
  );
}
