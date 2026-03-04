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
    <Card className="relative" data-testid={`board-card-${board.id}`}>
      <CardHeader>
        <Link href={`/board/${board.id}`} data-testid={`board-link-${board.id}`}>
          <CardTitle className="hover:underline">{board.name}</CardTitle>
        </Link>
        <CardDescription>
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
