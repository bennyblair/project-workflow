import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function HomePage() {
  const boards = await prisma.board.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { tickets: true } } },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold">FlowLine</h1>
      <p className="mb-8 text-muted-foreground">
        Visual workflow boards with timer-based ticket movement.
      </p>

      {boards.length === 0 ? (
        <p className="text-muted-foreground">
          No boards yet. Run <code className="rounded bg-muted px-1.5 py-0.5 text-sm">pnpm prisma:seed</code> to create sample data.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {boards.map((board) => (
            <Link key={board.id} href={`/board/${board.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{board.name}</CardTitle>
                  <CardDescription>
                    {board._count.tickets} ticket{board._count.tickets !== 1 && "s"} · {board.maxSteps} steps · {board.refreshIntervalSeconds}s refresh
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
