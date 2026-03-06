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
      className="relative overflow-hidden border-[3px] border-rpg-gold transition-all hover:border-rpg-gold/80 hover:-translate-y-0.5"
      data-testid={`board-card-${board.id}`}
      style={{ boxShadow: "2px 2px 0 rgba(251,191,36,0.3)" }}
    >
      {/* Bottom gold accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-rpg-gold"
      />
      <CardHeader>
        <Link href={`/board/${board.id}`} data-testid={`board-link-${board.id}`}>
          <CardTitle className="font-['Press_Start_2P'] text-[9px] text-rpg-dark-green hover:underline">{board.name}</CardTitle>
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
