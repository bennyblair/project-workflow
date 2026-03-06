"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type BoardCardProps = {
  board: {
    id: string;
    name: string;
    ticketCount: number;
    maxSteps: number;
    refreshIntervalSeconds: number;
  };
};

export function BoardCard({ board }: BoardCardProps) {
  return (
    <Card
      className="relative overflow-hidden border-neon-purple/25 transition-all hover:border-neon-purple/50 hover:-translate-y-0.5"
      data-testid={`board-card-${board.id}`}
      style={{ boxShadow: "none" }}
    >
      {/* Bottom neon accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background: "linear-gradient(90deg, oklch(0.65 0.28 340), oklch(0.82 0.16 195))" }}
      />
      <CardHeader>
        <Link href={`/board/${board.id}`} data-testid={`board-link-${board.id}`}>
          <CardTitle className="font-[Orbitron] text-sm font-bold text-neon-cyan hover:underline">{board.name}</CardTitle>
        </Link>
        <CardDescription className="text-xs">
          {board.ticketCount} ticket{board.ticketCount !== 1 && "s"} ·{" "}
          {board.maxSteps} steps · {board.refreshIntervalSeconds}s refresh
        </CardDescription>
        <div className="flex gap-2 pt-2">
          <Link href={`/board/${board.id}`}>
            <Button size="sm" variant="secondary">
              Open
            </Button>
          </Link>
          <Link href={`/settings/${board.id}`}>
            <Button size="sm" variant="ghost">
              Settings
            </Button>
          </Link>
        </div>
      </CardHeader>
    </Card>
  );
}
