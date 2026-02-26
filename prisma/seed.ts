import { PrismaClient, TicketStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding FlowLine database…");

  // ── Board 1: Engineering Sprint ──────────────────────────────────────
  const board1 = await prisma.board.create({
    data: {
      name: "Engineering Sprint",
      maxSteps: 10,
      refreshIntervalSeconds: 5,
    },
  });

  // ── Board 2: Design Pipeline ─────────────────────────────────────────
  const board2 = await prisma.board.create({
    data: {
      name: "Design Pipeline",
      maxSteps: 8,
      refreshIntervalSeconds: 10,
    },
  });

  // ── Ticket Types ─────────────────────────────────────────────────────
  const [bugType, taskType, featureType] = await Promise.all([
    prisma.ticketType.create({
      data: {
        boardId: board1.id,
        name: "Bug",
        key: "BUG",
        defaultColorHex: "#ef4444",
        stepIntervalSeconds: 60,
      },
    }),
    prisma.ticketType.create({
      data: {
        boardId: board1.id,
        name: "Task",
        key: "TASK",
        defaultColorHex: "#6366f1",
        stepIntervalSeconds: 180,
      },
    }),
    prisma.ticketType.create({
      data: {
        boardId: board1.id,
        name: "Feature",
        key: "FEAT",
        defaultColorHex: "#22c55e",
        stepIntervalSeconds: 300,
      },
    }),
  ]);

  const [designBug, designTask] = await Promise.all([
    prisma.ticketType.create({
      data: {
        boardId: board2.id,
        name: "Bug",
        key: "BUG",
        defaultColorHex: "#ef4444",
        stepIntervalSeconds: 90,
      },
    }),
    prisma.ticketType.create({
      data: {
        boardId: board2.id,
        name: "Task",
        key: "TASK",
        defaultColorHex: "#8b5cf6",
        stepIntervalSeconds: 120,
      },
    }),
  ]);

  // ── Teams ────────────────────────────────────────────────────────────
  const [frontendTeam, backendTeam] = await Promise.all([
    prisma.team.create({ data: { boardId: board1.id, name: "Frontend" } }),
    prisma.team.create({ data: { boardId: board1.id, name: "Backend" } }),
  ]);

  const [uxTeam] = await Promise.all([
    prisma.team.create({ data: { boardId: board2.id, name: "UX" } }),
  ]);

  // ── People ───────────────────────────────────────────────────────────
  const [alice, bob, charlie] = await Promise.all([
    prisma.person.create({ data: { boardId: board1.id, name: "Alice" } }),
    prisma.person.create({ data: { boardId: board1.id, name: "Bob" } }),
    prisma.person.create({ data: { boardId: board1.id, name: "Charlie" } }),
  ]);

  const [dana] = await Promise.all([
    prisma.person.create({ data: { boardId: board2.id, name: "Dana" } }),
  ]);

  // ── Swimlanes (Board 1) ─────────────────────────────────────────────
  await Promise.all([
    prisma.swimlane.create({
      data: {
        boardId: board1.id,
        name: "Frontend",
        order: 0,
        filterExprJson: {
          type: "condition",
          field: "team.name",
          operator: "eq",
          value: "Frontend",
        },
        onDropPatchJson: { teamId: frontendTeam.id },
      },
    }),
    prisma.swimlane.create({
      data: {
        boardId: board1.id,
        name: "Backend",
        order: 1,
        filterExprJson: {
          type: "condition",
          field: "team.name",
          operator: "eq",
          value: "Backend",
        },
        onDropPatchJson: { teamId: backendTeam.id },
      },
    }),
    prisma.swimlane.create({
      data: {
        boardId: board1.id,
        name: "Unassigned",
        order: 2,
        isCatchAll: true,
        filterExprJson: {},
        onDropPatchJson: {},
      },
    }),
  ]);

  // ── Swimlanes (Board 2) ─────────────────────────────────────────────
  await Promise.all([
    prisma.swimlane.create({
      data: {
        boardId: board2.id,
        name: "UX",
        order: 0,
        filterExprJson: {
          type: "condition",
          field: "team.name",
          operator: "eq",
          value: "UX",
        },
        onDropPatchJson: { teamId: uxTeam.id },
      },
    }),
    prisma.swimlane.create({
      data: {
        boardId: board2.id,
        name: "Catch All",
        order: 1,
        isCatchAll: true,
        filterExprJson: {},
        onDropPatchJson: {},
      },
    }),
  ]);

  // ── Color Rules (Board 1) ───────────────────────────────────────────
  await Promise.all([
    prisma.colorRule.create({
      data: {
        boardId: board1.id,
        order: 0,
        whenExprJson: {
          type: "condition",
          field: "stepIndex",
          operator: "gte",
          value: 8,
        },
        colorHex: "#ef4444", // red when nearing max steps
      },
    }),
    prisma.colorRule.create({
      data: {
        boardId: board1.id,
        order: 1,
        whenExprJson: {
          type: "condition",
          field: "stepIndex",
          operator: "gte",
          value: 5,
        },
        colorHex: "#f59e0b", // amber when above midpoint
      },
    }),
  ]);

  // ── Tickets (Board 1) ───────────────────────────────────────────────
  const now = new Date();

  // TODO tickets
  await Promise.all([
    prisma.ticket.create({
      data: {
        boardId: board1.id,
        title: "Fix login redirect loop",
        description: "Users are stuck in an OAuth redirect loop on Firefox.",
        typeId: bugType.id,
        assigneeId: alice.id,
        teamId: frontendTeam.id,
        status: TicketStatus.TODO,
        orderKey: 1000,
      },
    }),
    prisma.ticket.create({
      data: {
        boardId: board1.id,
        title: "Add pagination to /users endpoint",
        typeId: taskType.id,
        assigneeId: bob.id,
        teamId: backendTeam.id,
        status: TicketStatus.TODO,
        orderKey: 2000,
      },
    }),
    prisma.ticket.create({
      data: {
        boardId: board1.id,
        title: "Implement dark mode toggle",
        typeId: featureType.id,
        teamId: frontendTeam.id,
        status: TicketStatus.TODO,
        orderKey: 3000,
      },
    }),
  ]);

  // ACTIVE tickets (with varying startedAt for different step positions)
  await Promise.all([
    prisma.ticket.create({
      data: {
        boardId: board1.id,
        title: "Refactor auth middleware",
        typeId: taskType.id,
        assigneeId: charlie.id,
        teamId: backendTeam.id,
        status: TicketStatus.ACTIVE,
        orderKey: 1000,
        startedAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 min ago
      },
    }),
    prisma.ticket.create({
      data: {
        boardId: board1.id,
        title: "Fix CSS overflow on mobile",
        typeId: bugType.id,
        assigneeId: alice.id,
        teamId: frontendTeam.id,
        status: TicketStatus.ACTIVE,
        orderKey: 2000,
        startedAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 min ago
      },
    }),
  ]);

  // DONE tickets
  await prisma.ticket.create({
    data: {
      boardId: board1.id,
      title: "Set up CI pipeline",
      typeId: taskType.id,
      assigneeId: bob.id,
      teamId: backendTeam.id,
      status: TicketStatus.DONE,
      orderKey: 1000,
      startedAt: new Date(now.getTime() - 30 * 60 * 1000),
      doneAt: new Date(now.getTime() - 10 * 60 * 1000),
    },
  });

  // ── Tickets (Board 2) ───────────────────────────────────────────────
  await Promise.all([
    prisma.ticket.create({
      data: {
        boardId: board2.id,
        title: "Redesign onboarding flow",
        typeId: designTask.id,
        assigneeId: dana.id,
        teamId: uxTeam.id,
        status: TicketStatus.TODO,
        orderKey: 1000,
      },
    }),
    prisma.ticket.create({
      data: {
        boardId: board2.id,
        title: "Fix icon alignment on cards",
        typeId: designBug.id,
        assigneeId: dana.id,
        teamId: uxTeam.id,
        status: TicketStatus.ACTIVE,
        orderKey: 1000,
        startedAt: new Date(now.getTime() - 3 * 60 * 1000),
      },
    }),
  ]);

  console.log("✅ Seeded 2 boards, ticket types, teams, people, swimlanes, color rules, and tickets.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
