"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Update the sort order of boards within a project.
 * Accepts an array of { id, sortOrder } pairs.
 */
export async function reorderBoards(
  boardOrders: { id: string; sortOrder: number }[],
) {
  await prisma.$transaction(
    boardOrders.map(({ id, sortOrder }) =>
      prisma.board.update({ where: { id }, data: { sortOrder } }),
    ),
  );

  revalidatePath("/boards");
}
