"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  searchTickets,
  getProjectFilterOptions,
  type SearchTicketResult,
  type FilterOption,
} from "@/actions/search-tickets";
import {
  TicketFilterStrips,
  type TicketFilters,
} from "@/components/ticket-filter-strips";
import { TicketDetailPanel } from "@/components/ticket-detail-panel";

type Props = {
  projects: { id: string; name: string }[];
};

export function TicketBrowser({ projects }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id ?? "",
  );
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<TicketFilters>({});
  const [filterOptions, setFilterOptions] = useState<FilterOption | null>(null);
  const [results, setResults] = useState<SearchTicketResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Load filter options when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    setFilterOptions(null);
    getProjectFilterOptions(selectedProjectId).then(setFilterOptions);
  }, [selectedProjectId]);

  const doSearch = useCallback(
    async (q: string, f: TicketFilters) => {
      if (!selectedProjectId) return;
      setLoading(true);
      const data = await searchTickets(selectedProjectId, q, "", f);
      setResults(data);
      setLoading(false);
    },
    [selectedProjectId],
  );

  // Fetch on project change
  useEffect(() => {
    setQuery("");
    setFilters({});
    doSearch("", {});
  }, [selectedProjectId, doSearch]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => doSearch(query, filters), 300);
    return () => clearTimeout(timer);
  }, [query, filters, doSearch]);

  if (projects.length === 0) return null;

  return (
    <>
      <div className="space-y-3">
        {/* Project selector (if multiple projects) */}
        {projects.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="font-[Orbitron] text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Project
            </span>
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`rounded-full border px-2.5 py-0.5 font-[Orbitron] text-[9px] font-bold tracking-wide transition-all ${
                  selectedProjectId === p.id
                    ? "border-neon-pink bg-neon-pink/15 text-neon-pink shadow-[0_0_10px_oklch(0.65_0.28_340_/_0.3)]"
                    : "border-border text-foreground hover:border-neon-cyan/40 hover:bg-neon-cyan/5"
                }`}
                onClick={() => setSelectedProjectId(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        <Input
          placeholder="Search tickets by title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />

        {filterOptions && (
          <TicketFilterStrips
            options={filterOptions}
            filters={filters}
            onChange={setFilters}
          />
        )}

        {/* Results */}
        <div className="space-y-1">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Searching…
            </p>
          ) : results.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {query || Object.values(filters).some(Boolean)
                ? "No tickets match the current filters."
                : "No tickets in this project yet."}
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {results.length} ticket{results.length !== 1 && "s"}
                {results.length === 50 && " (showing first 50)"}
              </p>
              {results.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedTicketId(t.id)}
                >
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: t.type.defaultColorHex }}
                  />
                  <span className="font-[Orbitron] text-[10px] font-bold text-neon-yellow shrink-0">
                    {t.type.key}
                  </span>
                  <span className="truncate flex-1">{t.title}</span>
                  {t.assignee && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {t.assignee.name}
                    </span>
                  )}
                  {t.team && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {t.team.name}
                    </span>
                  )}
                  <StatusPill status={t.status} />
                  <span className="text-xs text-muted-foreground shrink-0">
                    {t.boardName}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <TicketDetailPanel
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
      />
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    TODO: "text-neon-cyan border border-neon-cyan/40 bg-neon-cyan/10",
    ACTIVE: "text-neon-green border border-neon-green/40 bg-neon-green/10",
    DONE: "text-muted-foreground border border-border bg-muted/30",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 font-[Orbitron] text-[8px] font-bold uppercase tracking-wider ${
        colors[status] ?? "text-muted-foreground border border-border bg-muted/30"
      }`}
    >
      {status}
    </span>
  );
}
