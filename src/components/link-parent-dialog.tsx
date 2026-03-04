"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  searchTickets,
  getProjectFilterOptions,
  type SearchTicketResult,
  type FilterOption,
  type TicketSearchFilters,
} from "@/actions/search-tickets";
import {
  TicketFilterStrips,
  type TicketFilters,
} from "@/components/ticket-filter-strips";

type Props = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  ticketId: string;
  onSelect: (parentId: string) => void;
};

export function LinkParentDialog({
  open,
  onClose,
  projectId,
  ticketId,
  onSelect,
}: Props) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<TicketFilters>({});
  const [filterOptions, setFilterOptions] = useState<FilterOption | null>(null);
  const [results, setResults] = useState<SearchTicketResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Load filter options once when dialog opens
  useEffect(() => {
    if (!open) return;
    getProjectFilterOptions(projectId).then(setFilterOptions);
  }, [open, projectId]);

  const doSearch = useCallback(
    async (q: string, f: TicketSearchFilters) => {
      setLoading(true);
      const data = await searchTickets(projectId, q, ticketId, f);
      setResults(data);
      setLoading(false);
    },
    [projectId, ticketId],
  );

  // Load all tickets on open
  useEffect(() => {
    if (!open) {
      setQuery("");
      setFilters({});
      setResults([]);
      return;
    }
    doSearch("", {});
  }, [open, doSearch]);

  // Debounce search on query/filter change
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => doSearch(query, filters), 300);
    return () => clearTimeout(timer);
  }, [query, filters, open, doSearch]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Parent Ticket</DialogTitle>
          <DialogDescription>
            Search for a ticket within this project to set as parent.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Search tickets by title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="mt-2"
        />

        {filterOptions && (
          <div className="mt-2">
            <TicketFilterStrips
              options={filterOptions}
              filters={filters}
              onChange={setFilters}
            />
          </div>
        )}

        <div className="mt-3 flex-1 overflow-y-auto max-h-[50vh] space-y-1">
          {loading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Searching…
            </p>
          ) : results.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {query || Object.values(filters).some(Boolean)
                ? "No tickets found"
                : "No other tickets in this project"}
            </p>
          ) : (
            results.map((t) => (
              <button
                key={t.id}
                type="button"
                className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors"
                onClick={() => {
                  onSelect(t.id);
                  onClose();
                }}
              >
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: t.type.defaultColorHex }}
                />
                <span className="font-medium text-muted-foreground shrink-0">
                  {t.type.key}
                </span>
                <span className="truncate flex-1">{t.title}</span>
                <StatusPill status={t.status} />
                <span className="text-xs text-muted-foreground shrink-0">
                  {t.boardName}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    TODO: "bg-yellow-100 text-yellow-800",
    ACTIVE: "bg-blue-100 text-blue-800",
    DONE: "bg-green-100 text-green-800",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
        colors[status] ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
}
